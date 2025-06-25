class StartupService {
  constructor(googleSheetsService) {
    this.googleSheetsService = googleSheetsService;
    this.startupCache = null;
    this.lastCacheUpdate = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async getAllStartups(forceRefresh = false) {
    try {
      // Check if cache is valid
      if (!forceRefresh && this.startupCache && this.lastCacheUpdate) {
        const cacheAge = Date.now() - this.lastCacheUpdate;
        if (cacheAge < this.cacheTimeout) {
          return this.startupCache;
        }
      }

      // Fetch fresh data
      console.log('Fetching startup data from Google Sheets...');
      const startups = await this.googleSheetsService.getStartupData();
      
      // Debug: Show data around row 1042 where DeepTrust should be
      if (startups.length > 1040) {
        console.log('🔍 Checking data around row 1042 for DeepTrust:');
        for (let i = 1038; i < Math.min(1046, startups.length); i++) {
          console.log(`Row ${i + 1}: "${startups[i].property}"`);
        }
      }
      
      // Update cache
      this.startupCache = startups;
      this.lastCacheUpdate = Date.now();
      
      console.log(`Loaded ${startups.length} startups into cache`);
      return startups;
    } catch (error) {
      console.error('Error getting startup data:', error);
      
      // Return cached data if available, even if stale
      if (this.startupCache) {
        console.log('Returning stale cache due to error');
        return this.startupCache;
      }
      
      return [];
    }
  }

  async searchStartups(query) {
    try {
      const startups = await this.getAllStartups();
      const lowerQuery = query.toLowerCase();
      
      console.log('🔍 SearchStartups called with query:', query);
      console.log('🔍 Total startups available:', startups.length);
      
      // Debug: Let's find DeepTrust specifically
      if (lowerQuery.includes('deeptrust') || lowerQuery.includes('deep trust')) {
        console.log('🔍 Searching for DeepTrust specifically...');
        
        // First, let's find any exact matches
        const exactMatches = startups.filter((startup, index) => {
          const property = startup.property ? startup.property.toLowerCase() : '';
          if (property === 'deeptrust') {
            console.log(`🎯 EXACT DeepTrust match found at index ${index}: "${startup.property}"`);
            return true;
          }
          return false;
        });
        
        if (exactMatches.length > 0) {
          console.log('✅ Found exact DeepTrust matches:', exactMatches.length);
          return exactMatches;
        }
        
        // If no exact match, look for partial matches
        const deepTrustMatches = startups.filter((startup, index) => {
          const property = startup.property ? startup.property.toLowerCase() : '';
          const hasDeepTrust = property.includes('deep') || property.includes('trust') || property.includes('deeptrust');
          if (hasDeepTrust) {
            console.log(`🎯 Found potential match at index ${index}: "${startup.property}"`);
          }
          return hasDeepTrust;
        });
        console.log(`Found ${deepTrustMatches.length} potential DeepTrust matches`);
        
        if (deepTrustMatches.length > 0) {
          return deepTrustMatches;
        }
      }
      
      // Search with weighted scoring
      const results = startups.map(startup => {
        let score = 0;
        const property = startup.property ? startup.property.toLowerCase() : '';
        const name = startup.name ? startup.name.toLowerCase() : '';
        const description = startup.description ? startup.description.toLowerCase() : '';
        const industry = startup.industry ? startup.industry.toLowerCase() : '';
        
        // Exact match bonus (property is primary field)
        if (property === lowerQuery) score += 100;
        if (name === lowerQuery) score += 90;
        
        // Starts with bonus
        if (property.startsWith(lowerQuery)) score += 50;
        if (name.startsWith(lowerQuery)) score += 45;
        
        // Contains in property (primary field)
        if (property.includes(lowerQuery)) score += 30;
        
        // Contains in name
        if (name.includes(lowerQuery)) score += 25;
        
        // Contains in description
        if (description.includes(lowerQuery)) score += 10;
        
        // Contains in industry
        if (industry.includes(lowerQuery)) score += 5;
        
        // Word boundary matches (better than partial matches)
        const words = lowerQuery.split(' ');
        words.forEach(word => {
          if (word.length > 2) { // Only check words longer than 2 characters
            const regex = new RegExp(`\\b${word}`, 'i');
            if (regex.test(startup.property)) score += 20;
            if (regex.test(startup.name)) score += 15;
            if (regex.test(startup.description)) score += 8;
            if (regex.test(startup.industry)) score += 3;
          }
        });
        
        return { ...startup, score };
      });
      
      // Filter results with score > 0 and sort by score
      const filteredResults = results
        .filter(result => result.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ score, ...startup }) => startup);
        
      console.log('🔍 SearchStartups: found', filteredResults.length, 'results');
      return filteredResults;
        
    } catch (error) {
      console.error('Error searching startups:', error);
      return [];
    }
  }

  async getStartupByName(name) {
    try {
      const startups = await this.getAllStartups();
      const lowerName = name.toLowerCase();
      
      // Try exact match first (check property field first)
      let startup = startups.find(s => 
        s.property && s.property.toLowerCase() === lowerName
      );
      
      // If no exact match in property, try name field
      if (!startup) {
        startup = startups.find(s => 
          s.name && s.name.toLowerCase() === lowerName
        );
      }
      
      // If no exact match, try partial match in property
      if (!startup) {
        startup = startups.find(s => 
          s.property && s.property.toLowerCase().includes(lowerName)
        );
      }
      
      // If no partial match in property, try partial match in name
      if (!startup) {
        startup = startups.find(s => 
          s.name && s.name.toLowerCase().includes(lowerName)
        );
      }
      
      return startup || null;
    } catch (error) {
      console.error('Error getting startup by name:', error);
      return null;
    }
  }

  async getStartupsByIndustry(industry) {
    try {
      const startups = await this.getAllStartups();
      const lowerIndustry = industry.toLowerCase();
      
      return startups.filter(startup => 
        startup.industry && startup.industry.toLowerCase().includes(lowerIndustry)
      );
    } catch (error) {
      console.error('Error getting startups by industry:', error);
      return [];
    }
  }

  async refreshCache() {
    try {
      console.log('Manually refreshing startup cache...');
      return await this.getAllStartups(true);
    } catch (error) {
      console.error('Error refreshing cache:', error);
      throw error;
    }
  }

  getCacheInfo() {
    return {
      cached: !!this.startupCache,
      count: this.startupCache ? this.startupCache.length : 0,
      lastUpdate: this.lastCacheUpdate,
      age: this.lastCacheUpdate ? Date.now() - this.lastCacheUpdate : null
    };
  }
}

module.exports = { StartupService }; 
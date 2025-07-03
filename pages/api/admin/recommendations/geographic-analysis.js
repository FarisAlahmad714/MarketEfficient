import connectDB from '../../../../lib/database';
import User from '../../../../models/User';
import { requireAdmin } from '../../../../middleware/auth';
import { getRegionFromCountry } from '../../../../lib/geolocation';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return new Promise((resolve) => {
    requireAdmin(req, res, async () => {
      try {
        await connectDB();

        // Get country distribution
        const countryStats = await User.aggregate([
          {
            $match: {
              country: { $exists: true, $ne: '', $ne: null }
            }
          },
          {
            $group: {
              _id: {
                country: '$country',
                countryCode: '$countryCode'
              },
              userCount: { $sum: 1 },
              cities: { $addToSet: '$city' },
              regions: { $addToSet: '$region' },
              lastActivity: { $max: '$updatedAt' },
              registrationDates: { $push: '$createdAt' }
            }
          },
          {
            $project: {
              country: '$_id.country',
              countryCode: '$_id.countryCode',
              userCount: 1,
              cityCount: { $size: { $filter: { input: '$cities', as: 'city', cond: { $ne: ['$$city', ''] } } } },
              regionCount: { $size: { $filter: { input: '$regions', as: 'region', cond: { $ne: ['$$region', ''] } } } },
              lastActivity: 1,
              firstRegistration: { $min: '$registrationDates' },
              latestRegistration: { $max: '$registrationDates' }
            }
          },
          {
            $sort: { userCount: -1 }
          },
          {
            $limit: 20
          }
        ]);

        // Calculate regional distribution
        const regionalStats = {};
        countryStats.forEach(country => {
          const region = getRegionFromCountry(country.countryCode);
          if (!regionalStats[region]) {
            regionalStats[region] = {
              region,
              userCount: 0,
              countries: [],
              topCountry: { name: '', userCount: 0 }
            };
          }
          regionalStats[region].userCount += country.userCount;
          regionalStats[region].countries.push({
            name: country.country,
            code: country.countryCode,
            userCount: country.userCount
          });
          
          // Track top country in region
          if (country.userCount > regionalStats[region].topCountry.userCount) {
            regionalStats[region].topCountry = {
              name: country.country,
              userCount: country.userCount
            };
          }
        });

        // Convert to array and sort
        const regionalDistribution = Object.values(regionalStats)
          .sort((a, b) => b.userCount - a.userCount)
          .map(region => ({
            ...region,
            countries: region.countries.sort((a, b) => b.userCount - a.userCount).slice(0, 5)
          }));

        // Get total users for percentage calculations
        const totalUsers = await User.countDocuments({
          country: { $exists: true, $ne: '', $ne: null }
        });

        // Calculate growth trends (users registered in last 30 days by country)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentGrowth = await User.aggregate([
          {
            $match: {
              createdAt: { $gte: thirtyDaysAgo },
              country: { $exists: true, $ne: '', $ne: null }
            }
          },
          {
            $group: {
              _id: {
                country: '$country',
                countryCode: '$countryCode'
              },
              newUsers: { $sum: 1 }
            }
          },
          {
            $sort: { newUsers: -1 }
          },
          {
            $limit: 10
          }
        ]);

        // Identify business opportunities
        const businessInsights = generateBusinessInsights(countryStats, regionalDistribution, recentGrowth, totalUsers);

        // Get top markets
        const topMarkets = countryStats.slice(0, 10).map((country, index) => ({
          rank: index + 1,
          country: country.country,
          countryCode: country.countryCode,
          userCount: country.userCount,
          percentage: ((country.userCount / totalUsers) * 100).toFixed(1),
          cityCount: country.cityCount,
          regionCount: country.regionCount,
          marketPenetration: country.cityCount > 5 ? 'High' : country.cityCount > 2 ? 'Medium' : 'Low',
          firstUser: country.firstRegistration,
          latestUser: country.latestRegistration,
          growthTrend: calculateGrowthTrend(country, recentGrowth)
        }));

        res.status(200).json({
          summary: {
            totalUsers,
            totalCountries: countryStats.length,
            totalRegions: regionalDistribution.length,
            topMarket: topMarkets[0] || null
          },
          topMarkets,
          regionalDistribution,
          recentGrowth: recentGrowth.map(growth => ({
            country: growth._id.country,
            countryCode: growth._id.countryCode,
            newUsers: growth.newUsers,
            growthRate: ((growth.newUsers / totalUsers) * 100).toFixed(2)
          })),
          businessInsights
        });

      } catch (error) {
        console.error('Geographic analysis error:', error);
        res.status(500).json({ error: 'Failed to fetch geographic analysis data' });
      } finally {
        resolve();
      }
    });
  });
}

function generateBusinessInsights(countryStats, regionalDistribution, recentGrowth, totalUsers) {
  const insights = [];

  // Market concentration insight
  if (countryStats.length > 0) {
    const topCountryPercentage = (countryStats[0].userCount / totalUsers) * 100;
    if (topCountryPercentage > 50) {
      insights.push({
        type: 'market_concentration',
        priority: 'high',
        title: 'High Market Concentration',
        description: `${topCountryPercentage.toFixed(1)}% of users are from ${countryStats[0].country}. Consider diversifying your user base or focusing on localization for this market.`,
        actionItems: [
          `Optimize product features for ${countryStats[0].country} market`,
          'Consider local payment methods and currency support',
          'Diversify marketing to other regions'
        ]
      });
    }
  }

  // Growth opportunity insight
  if (recentGrowth.length > 0) {
    const fastestGrowingCountry = recentGrowth[0];
    insights.push({
      type: 'growth_opportunity',
      priority: 'medium',
      title: `Growing Market: ${fastestGrowingCountry._id.country}`,
      description: `${fastestGrowingCountry.newUsers} new users from ${fastestGrowingCountry._id.country} in the last 30 days. This market shows strong growth potential.`,
      actionItems: [
        `Increase marketing investment in ${fastestGrowingCountry._id.country}`,
        'Research local trading preferences and regulations',
        'Consider localized content and support'
      ]
    });
  }

  // Regional expansion insight
  const underrepresentedRegions = ['Asia-Pacific', 'Europe', 'South America', 'Middle East & Africa']
    .filter(region => !regionalDistribution.some(r => r.region === region));
  
  if (underrepresentedRegions.length > 0) {
    insights.push({
      type: 'expansion_opportunity',
      priority: 'low',
      title: 'Expansion Opportunities',
      description: `Low presence in: ${underrepresentedRegions.join(', ')}. These regions represent untapped market potential.`,
      actionItems: [
        'Research regulatory requirements for target regions',
        'Develop region-specific marketing strategies',
        'Consider partnerships with local financial services'
      ]
    });
  }

  // Compliance insight
  const regulatedMarkets = countryStats.filter(country => 
    ['US', 'GB', 'DE', 'FR', 'AU', 'CA', 'JP'].includes(country.countryCode)
  );
  
  if (regulatedMarkets.length > 0) {
    insights.push({
      type: 'compliance',
      priority: 'high',
      title: 'Regulatory Compliance',
      description: `Significant user base in regulated markets: ${regulatedMarkets.map(c => c.country).join(', ')}. Ensure compliance with local financial regulations.`,
      actionItems: [
        'Review KYC/AML requirements for each market',
        'Implement region-specific user verification',
        'Consider regulatory licenses where required'
      ]
    });
  }

  return insights;
}

function calculateGrowthTrend(country, recentGrowth) {
  const recentGrowthForCountry = recentGrowth.find(g => g._id.countryCode === country.countryCode);
  if (!recentGrowthForCountry) return 'Stable';
  
  const growthRate = (recentGrowthForCountry.newUsers / country.userCount) * 100;
  if (growthRate > 20) return 'High Growth';
  if (growthRate > 10) return 'Growing';
  if (growthRate > 5) return 'Moderate Growth';
  return 'Stable';
}
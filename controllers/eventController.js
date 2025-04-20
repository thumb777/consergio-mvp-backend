const db = require("../models");
const Event = db.event;
const { Op } = require("sequelize");
const sequelize = db.sequelize;
require("dotenv").config();

// exports.getAllEvents = async (req, res) => {
//   try {
//     const events = await Events.findAll();
//     res.json(events);
//   } catch (error) {
//     console.error("Error fetching events:", error);
//     res.status(500).json({ error: "Failed to fetch events" });
//   }
// };

const getAllEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const offset = (page - 1) * limit;

    const { count, rows: events } = await Event.findAndCountAll({
      limit: limit,
      offset: offset,
      order: [["start_date", "ASC"]], // Optional: sort by date
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      data: {
        events: events,
        currentPage: page,
        totalPages: totalPages,
        totalEvents: count,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getEventsByTags = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const offset = (page - 1) * limit;
    const originalQuery = req.query.query || "";
    const tagKey = req.query.tagKey;
    const tagValue = req.query.tagValue;
    const clearAll = req.query.clearAll === 'true';
    
    let modifiedQuery = "";
    
    if (clearAll) {
      // If clearing all tags, use a simple query
      modifiedQuery = "SELECT * FROM events ORDER BY start_date, start_time";
    } else if (tagKey && tagValue && originalQuery) {
      // Handle tag removal by modifying the original query
      // Create different patterns to match based on tag type
      let patterns = [];
      
      if (tagKey === 'categories') {
        patterns.push(`EXISTS \\(SELECT 1 FROM UNNEST\\(categories\\) cat WHERE LOWER\\(cat\\) ILIKE LOWER\\('%${tagValue}%'\\)\\)`);
        patterns.push(`categories LIKE '%${tagValue}%'`);
      } 
      else if (tagKey === 'start_date') {
        patterns.push(`start_date = '${tagValue}'`);
      }
      else if (tagKey === 'start_time') {
        if (tagValue.includes('>=')) {
          const timeValue = tagValue.replace('>=', '').trim();
          patterns.push(`start_time >= '${timeValue}'`);
        } else if (tagValue.includes('<=')) {
          const timeValue = tagValue.replace('<=', '').trim();
          patterns.push(`start_time <= '${timeValue}'`);
        } else if (tagValue.includes('>')) {
          const timeValue = tagValue.replace('>', '').trim();
          patterns.push(`start_time > '${timeValue}'`);
        } else if (tagValue.includes('<')) {
          const timeValue = tagValue.replace('<', '').trim();
          patterns.push(`start_time < '${timeValue}'`);
        } else {
          patterns.push(`start_time = '${tagValue}'`);
        }
      }
      else if (tagKey === 'price_min') {
        patterns.push(`price_min > ${tagValue}`);
      }
      else if (tagKey === 'price_max') {
        patterns.push(`price_max < ${tagValue}`);
      }
      else if (tagKey === 'venue_name' || tagKey === 'venue_city' || tagKey === 'name') {
        patterns.push(`${tagKey} ILIKE '%${tagValue}%'`);
      }
      
      // Process the query to remove the condition
      modifiedQuery = originalQuery;
      
      for (const pattern of patterns) {
        // Try to remove the condition with AND before it
        const andPattern = new RegExp(`\\sAND\\s+${pattern}`, 'i');
        if (andPattern.test(modifiedQuery)) {
          modifiedQuery = modifiedQuery.replace(andPattern, '');
          break;
        }
        
        // Try to remove the condition with AND after it
        const andAfterPattern = new RegExp(`${pattern}\\s+AND\\s`, 'i');
        if (andAfterPattern.test(modifiedQuery)) {
          modifiedQuery = modifiedQuery.replace(andAfterPattern, '');
          break;
        }
        
        // Try to remove the condition if it's the only one (after WHERE)
        const wherePattern = new RegExp(`WHERE\\s+${pattern}\\s+ORDER`, 'i');
        if (wherePattern.test(modifiedQuery)) {
          modifiedQuery = modifiedQuery.replace(new RegExp(`WHERE\\s+${pattern}`, 'i'), 'WHERE 1=1');
          modifiedQuery = modifiedQuery.replace('WHERE 1=1 ORDER', 'ORDER');
          break;
        }
      }
      
      // Clean up any potential syntax issues
      modifiedQuery = modifiedQuery.replace(/WHERE\s+AND/i, 'WHERE');
      modifiedQuery = modifiedQuery.replace(/WHERE\s+ORDER/i, 'ORDER');
    } else {
      // If no modification needed, use the original query
      modifiedQuery = originalQuery || "SELECT * FROM events ORDER BY start_date, start_time";
    }
    
    console.log("Modified query:", modifiedQuery);
    
    // Execute the modified query with pagination
    const countQuery = `SELECT COUNT(*) as total FROM (${modifiedQuery}) AS subquery`;
    const [{ total }] = await db.sequelize.query(countQuery, {
      type: db.sequelize.QueryTypes.SELECT,
    });
    const totalCount = parseInt(total);
    
    const paginatedQuery = `${modifiedQuery} LIMIT ${limit} OFFSET ${offset}`;
    const events = await db.sequelize.query(paginatedQuery, {
      type: db.sequelize.QueryTypes.SELECT,
    });
    
    // Extract tags from the modified query
    const tagLists = [];
    
    // Check for categories
    const categoryMatch = modifiedQuery.match(/UNNEST\(categories\) cat WHERE LOWER\(cat\) ILIKE LOWER\('%([^%]+)%'\)/i);
    if (categoryMatch) {
      tagLists.push({ categories: categoryMatch[1] });
    }
    
    // Check for start_date
    const dateMatch = modifiedQuery.match(/start_date = '([^']+)'/i);
    if (dateMatch) {
      tagLists.push({ start_date: dateMatch[1] });
    }
    
    // Check for start_time with different operators
    const timeGtMatch = modifiedQuery.match(/start_time > '([^']+)'/i);
    if (timeGtMatch) {
      tagLists.push({ start_time: `> ${timeGtMatch[1]}` });
    }
    
    const timeLtMatch = modifiedQuery.match(/start_time < '([^']+)'/i);
    if (timeLtMatch) {
      tagLists.push({ start_time: `< ${timeLtMatch[1]}` });
    }
    
    const timeEqMatch = modifiedQuery.match(/start_time = '([^']+)'/i);
    if (timeEqMatch) {
      tagLists.push({ start_time: timeEqMatch[1] });
    }
    
    // Extract subcategories for recommendations
    const subcategoryFrequency = new Map();
    let searchCategory = "";
    
    // Find if there's a category in the tags
    const categoryTag = tagLists.find(tag => Object.keys(tag)[0] === 'categories');
    if (categoryTag) {
      searchCategory = categoryTag.categories.toLowerCase();
    }
    
    // Process events to extract subcategories
    events.forEach((event) => {
      if (Array.isArray(event.categories) && event.categories.length > 1) {
        event.categories.slice(1).forEach((subcat) => {
          const subcatLower = subcat.toLowerCase();
          if (subcatLower !== "other" && !subcatLower.includes(searchCategory)) {
            subcategoryFrequency.set(
              subcat,
              (subcategoryFrequency.get(subcat) || 0) + 1
            );
          }
        });
      }
    });
    
    // Sort subcategories by frequency
    let sortedSubcategories = Array.from(subcategoryFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .map((entry) => entry[0]);
    
    if (subcategoryFrequency.size === 0) {
      sortedSubcategories = ["Music", "Sports", "Dance"];
    } else if (sortedSubcategories.length <= 1) {
      sortedSubcategories = [];
    }
    
    res.status(200).json({
      events: events,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      totalEvents: totalCount,
      tagLists: tagLists,
      subcategories: sortedSubcategories,
      query: modifiedQuery
    });
  } catch (error) {
    console.error("Error in getEventsByTags:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



// exports.getEventsByCategories = async (req, res) => {
//   try {
//     const { categories } = req.query;
//     const categoryArray = categories ? categories.split(",") : [];

//     const events = await Events.findAll({
//       where:
//         categoryArray.length > 0
//           ? {
//               categories: {
//                 [Op.overlap]: categoryArray,
//               },
//             }
//           : {},
//     });

//     res.json(events);
//   } catch (error) {
//     console.error("Error fetching events by categories:", error);
//     res.status(500).json({ error: "Failed to fetch events" });
//   }
// };

module.exports = {
  getAllEvents, getEventsByTags
};

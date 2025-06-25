export const studyContent = {
  // ====== FOUNDATIONS (BEGINNER) ======
  "Trading Fundamentals": {
    level: "beginner",
    icon: "fas fa-seedling",
    description: "Essential building blocks every trader must master",
    estimatedTime: "25 minutes",
    category: "foundations",
    lessons: {
      "Market Structure Basics": {
        content: `
          <div class="lesson-intro">
            <p>Market structure is the foundation of technical analysis. Understanding how markets move in patterns of highs and lows is crucial for successful trading.</p>
            <img src="/images/Range.png" alt="Market Structure Example" class="lesson-image" />
          </div>
          
          <div class="concept-section">
            <h4>What is Market Structure?</h4>
            <p>Market structure refers to the pattern of price movements that create identifiable highs and lows on a chart. These patterns help traders understand:</p>
            <ul>
              <li>The direction of the trend</li>
              <li>Potential reversal points</li>
              <li>Support and resistance levels</li>
              <li>Entry and exit opportunities</li>
            </ul>
          </div>

          <div class="key-points">
            <h4>Key Components:</h4>
            <div class="point-grid">
              <div class="point-card">
                <h5>Swing Highs</h5>
                <p>Peaks in price action where price temporarily reverses downward</p>
              </div>
              <div class="point-card">
                <h5>Swing Lows</h5>
                <p>Valleys in price action where price temporarily reverses upward</p>
              </div>
              <div class="point-card">
                <h5>Trend Direction</h5>
                <p>Determined by the sequence of higher/lower highs and lows</p>
              </div>
            </div>
          </div>
        `,
        quiz: {
          question: "What does market structure help traders identify?",
          options: [
            "Only the current price",
            "Trend direction and potential reversal points",
            "Only support levels",
            "Market opening times"
          ],
          correct: 2,
          explanation: "Market structure helps traders identify trend direction, potential reversal points, support/resistance levels, and trading opportunities."
        }
      },
      
      "Understanding Swing Points": {
        content: `
          <div class="lesson-intro">
            <p>Swing points are the building blocks of market structure. Learning to identify them accurately is essential for technical analysis.</p>
            <img src="/images/SwingPoints.png" alt="Swing Points Example" class="lesson-image" />
          </div>
          
          <div class="concept-section">
            <h4>Swing High Definition</h4>
            <p>A swing high is formed when:</p>
            <ol>
              <li>Price reaches a peak</li>
              <li>At least 2 candles before and after are lower</li>
              <li>It represents a temporary reversal point</li>
            </ol>
            
            <h4>Swing Low Definition</h4>
            <p>A swing low is formed when:</p>
            <ol>
              <li>Price reaches a valley</li>
              <li>At least 2 candles before and after are higher</li>
              <li>It represents a temporary reversal point</li>
            </ol>
          </div>

          <div class="practice-section">
            <h4>Identification Rules:</h4>
            <div class="rule-list">
              <div class="rule-item">
                <i class="fas fa-check-circle"></i>
                <span>Look for clear peaks and valleys</span>
              </div>
              <div class="rule-item">
                <i class="fas fa-check-circle"></i>
                <span>Confirm with surrounding price action</span>
              </div>
              <div class="rule-item">
                <i class="fas fa-check-circle"></i>
                <span>Consider the timeframe context</span>
              </div>
            </div>
          </div>
        `,
        quiz: {
          question: "How many candles before and after a peak are typically needed to confirm a swing high?",
          options: [
            "At least 1 candle",
            "At least 2 candles", 
            "At least 5 candles",
            "At least 10 candles"
          ],
          correct: 2,
          explanation: "At least 2 candles before and after a peak are typically needed to confirm a valid swing high."
        }
      },

      "Trend Analysis Fundamentals": {
        content: `
          <div class="lesson-intro">
            <p>Understanding trends through market structure allows you to trade with the momentum rather than against it.</p>
            <img src="/images/Practice.png" alt="Trend Analysis" class="lesson-image" />
          </div>
          
          <div class="trend-types">
            <h4>Types of Trends:</h4>
            
            <div class="trend-card uptrend">
              <h5>Uptrend (Bullish)</h5>
              <p>Characterized by:</p>
              <ul>
                <li>Higher Highs (HH)</li>
                <li>Higher Lows (HL)</li>
                <li>Consistent upward movement</li>
              </ul>
            </div>

            <div class="trend-card downtrend">
              <h5>Downtrend (Bearish)</h5>
              <p>Characterized by:</p>
              <ul>
                <li>Lower Highs (LH)</li>
                <li>Lower Lows (LL)</li>
                <li>Consistent downward movement</li>
              </ul>
            </div>

            <div class="trend-card sideways">
              <h5>Sideways (Ranging)</h5>
              <p>Characterized by:</p>
              <ul>
                <li>Equal Highs and Lows</li>
                <li>Horizontal price movement</li>
                <li>Consolidation pattern</li>
              </ul>
            </div>
          </div>

          <div class="trading-implications">
            <h4>Trading Implications:</h4>
            <p>Understanding trend structure helps you:</p>
            <ul>
              <li>Enter trades in the direction of the trend</li>
              <li>Identify potential reversal points</li>
              <li>Set appropriate stop losses and targets</li>
              <li>Avoid counter-trend trades</li>
            </ul>
          </div>
        `,
        quiz: {
          question: "What characterizes an uptrend in market structure?",
          options: [
            "Lower highs and lower lows",
            "Higher highs and higher lows",
            "Equal highs and lows",
            "Random price movement"
          ],
          correct: 2,
          explanation: "An uptrend is characterized by higher highs and higher lows, showing consistent upward momentum."
        }
      }
    }
  },

  "Risk Management Essentials": {
    level: "beginner",
    icon: "fas fa-shield-alt",
    description: "Protect your capital with fundamental risk management principles",
    estimatedTime: "20 minutes",
    category: "foundations",
    lessons: {
      "Capital Protection Basics": {
        content: `
          <div class="lesson-intro">
            <p>Risk management is the cornerstone of successful trading. It's not about being right all the time, but about protecting your capital when you're wrong.</p>
            <img src="/images/DiscountPremiumLong.png" alt="Risk Management" class="lesson-image" />
          </div>
          
          <div class="concept-section">
            <h4>Why Risk Management Matters:</h4>
            <div class="point-grid">
              <div class="point-card">
                <h5>Preserves Capital</h5>
                <p>Limits losses on individual trades to protect your account from ruin</p>
              </div>
              <div class="point-card">
                <h5>Emotional Control</h5>
                <p>Reduces stress and prevents emotional decision-making</p>
              </div>
              <div class="point-card">
                <h5>Long-term Success</h5>
                <p>Ensures you can trade another day, even after losses</p>
              </div>
            </div>
          </div>

          <div class="rule-section">
            <h4>The 1% Rule:</h4>
            <p>Never risk more than 1-2% of your account on a single trade. This simple rule can be the difference between success and failure in trading.</p>
            
            <div class="calculation-example">
              <h5>Example:</h5>
              <ul>
                <li>Account Size: $10,000</li>
                <li>Risk per Trade: 1% = $100</li>
                <li>If stop loss is 50 pips away, position size = $100 ÷ 50 = $2 per pip</li>
              </ul>
            </div>
          </div>
        `,
        quiz: {
          question: "What is the maximum percentage of your account you should risk on a single trade?",
          options: [
            "5-10%",
            "1-2%", 
            "10-15%",
            "20-25%"
          ],
          correct: 2,
          explanation: "The 1-2% rule is a fundamental principle that helps preserve capital and ensure long-term trading success."
        }
      },

      "Position Sizing Fundamentals": {
        content: `
          <div class="lesson-intro">
            <p>Position sizing determines how much capital you allocate to each trade. It's the bridge between your risk management plan and execution.</p>
            <img src="/images/DiscountPremiumShort.png" alt="Position Sizing" class="lesson-image" />
          </div>
          
          <div class="formula-section">
            <h4>Position Size Formula:</h4>
            <div class="formula-card">
              <h5>Position Size = (Account Risk ÷ Trade Risk) × Account Size</h5>
              <p>Where Trade Risk = Entry Price - Stop Loss Price</p>
            </div>
          </div>

          <div class="example-section">
            <h4>Step-by-Step Example:</h4>
            <div class="calculation-steps">
              <div class="step">
                <h6>Step 1: Determine Account Risk</h6>
                <p>$10,000 account × 1% = $100 maximum risk</p>
              </div>
              <div class="step">
                <h6>Step 2: Calculate Trade Risk</h6>
                <p>Entry at $50, Stop Loss at $48 = $2 risk per share</p>
              </div>
              <div class="step">
                <h6>Step 3: Calculate Position Size</h6>
                <p>$100 ÷ $2 = 50 shares maximum</p>
              </div>
            </div>
          </div>
        `,
        quiz: {
          question: "If your account is $5,000 and you risk 1% per trade, what's your maximum dollar risk?",
          options: [
            "$25",
            "$50",
            "$100",
            "$250"
          ],
          correct: 2,
          explanation: "$5,000 × 1% = $50. This is your maximum risk per trade to maintain proper risk management."
        }
      }
    }
  },

  // ====== INTERMEDIATE CONCEPTS ======
  "Price Action Mastery": {
    level: "intermediate",
    icon: "fas fa-chart-line",
    description: "Advanced market structure and price action analysis",
    estimatedTime: "35 minutes",
    category: "price-action",
    lessons: {
      "Advanced Swing Analysis": {
        content: `
          <div class="lesson-intro">
            <p>Master the deeper aspects of swing point analysis and their practical applications in real trading scenarios.</p>
            <img src="/images/SwingHigh.png" alt="Advanced Swing Analysis" class="lesson-image" />
          </div>
          
          <div class="concept-section">
            <h4>Swing Point Significance:</h4>
            <ul>
              <li><strong>Liquidity Zones:</strong> Swing points attract stop losses and pending orders</li>
              <li><strong>Institutional Interest:</strong> Major players often target these levels</li>
              <li><strong>Support/Resistance:</strong> Previous swing points become future S/R levels</li>
              <li><strong>Trend Confirmation:</strong> Breaking swing points confirms trend changes</li>
            </ul>
          </div>

          <div class="application-section">
            <h4>Trading Applications:</h4>
            <div class="strategy-grid">
              <div class="strategy-card">
                <h5>Swing Point Breaks</h5>
                <p>Enter trades when price decisively breaks above/below key swing points</p>
              </div>
              <div class="strategy-card">
                <h5>Pullback Entries</h5>
                <p>Use swing points as entry levels during trend pullbacks</p>
              </div>
              <div class="strategy-card">
                <h5>Stop Loss Placement</h5>
                <p>Place stops beyond swing points to avoid false signals</p>
              </div>
            </div>
          </div>
        `,
        quiz: {
          question: "What makes swing points significant for traders?",
          options: [
            "They're random price levels",
            "They attract liquidity and institutional interest",
            "They only work on daily charts",
            "They're always support levels"
          ],
          correct: 2,
          explanation: "Swing points are significant because they attract liquidity through stop losses and pending orders, making them key levels for institutional traders."
        }
      },

      "Liquidity Pool Analysis": {
        content: `
          <div class="lesson-intro">
            <p>Understanding where liquidity sits in the market and how institutions target these areas for better entries.</p>
            <img src="/images/OldH&L.png" alt="Liquidity Analysis" class="lesson-image" />
          </div>
          
          <div class="liquidity-types">
            <h4>Types of Liquidity:</h4>
            <div class="point-grid">
              <div class="point-card">
                <h5>Buy-Side Liquidity</h5>
                <img src="/images/SwingHigh.png" alt="Buy-Side Liquidity" class="concept-image" />
                <p>Stop losses from short positions sitting above swing highs</p>
              </div>
              <div class="point-card">
                <h5>Sell-Side Liquidity</h5>
                <img src="/images/SwingLow.png" alt="Sell-Side Liquidity" class="concept-image" />
                <p>Stop losses from long positions sitting below swing lows</p>
              </div>
            </div>
          </div>

          <div class="identification-section">
            <h4>Identifying Liquidity Pools:</h4>
            <ol>
              <li><strong>Equal Highs/Lows:</strong> Multiple touches at the same level</li>
              <li><strong>Previous Swing Points:</strong> Historical highs and lows</li>
              <li><strong>Round Numbers:</strong> Psychological levels (1.2000, 1850, etc.)</li>
              <li><strong>Trendline Intersections:</strong> Where multiple technical levels converge</li>
            </ol>
          </div>
        `,
        quiz: {
          question: "Where is sell-side liquidity typically found?",
          options: [
            "Above swing highs",
            "Below swing lows",
            "At random price levels",
            "Only at round numbers"
          ],
          correct: 2,
          explanation: "Sell-side liquidity is found below swing lows where long traders place their stop losses, creating clusters of sell orders."
        }
      }
    }
  },

  "Fair Value Gaps": {
    level: "intermediate",
    icon: "fas fa-expand-arrows-alt",
    description: "Master institutional order flow through gap analysis",
    estimatedTime: "40 minutes",
    category: "price-action",
    lessons: {
      "FVG Fundamentals": {
        content: `
          <div class="lesson-intro">
            <p>Fair Value Gaps represent imbalances in market structure where price moved too quickly, leaving unfilled orders behind.</p>
            <img src="/images/FVG_Description.png" alt="FVG Fundamentals" class="lesson-image" />
          </div>
          
          <div class="fvg-definition">
            <h4>What Creates Fair Value Gaps?</h4>
            <ul>
              <li><strong>Rapid Price Movement:</strong> Price moves too quickly through a level</li>
              <li><strong>Order Imbalance:</strong> More buyers than sellers (or vice versa)</li>
              <li><strong>Institutional Activity:</strong> Large orders creating displacement</li>
              <li><strong>News Events:</strong> Market reactions to unexpected information</li>
            </ul>
          </div>

          <div class="fvg-types">
            <h4>Types of Fair Value Gaps:</h4>
            
            <div class="fvg-type bullish">
              <h5>Bullish FVG (BISI)</h5>
              <img src="/images/Bullish_FVG.png" alt="Bullish FVG" class="fvg-image" />
              <p>Buy-side Imbalance, Sell-side Inefficiency - occurs during strong upward moves</p>
            </div>

            <div class="fvg-type bearish">
              <h5>Bearish FVG (SIBI)</h5>
              <img src="/images/Bearish_FVG_1.png" alt="Bearish FVG" class="fvg-image" />
              <p>Sell-side Imbalance, Buy-side Inefficiency - occurs during strong downward moves</p>
            </div>
          </div>
        `,
        quiz: {
          question: "What does BISI stand for in FVG analysis?",
          options: [
            "Buy Immediately, Sell Immediately",
            "Buy-side Imbalance, Sell-side Inefficiency",
            "Bullish Indicator, Strong Increase",
            "Basic Information, Standard Input"
          ],
          correct: 2,
          explanation: "BISI stands for Buy-side Imbalance, Sell-side Inefficiency, describing a bullish Fair Value Gap where buying pressure overwhelmed sellers."
        }
      },

      "FVG Trading Strategies": {
        content: `
          <div class="lesson-intro">
            <p>Learn practical strategies for trading Fair Value Gaps, including mitigation, inversion, and confluence analysis.</p>
            <img src="/images/Bearish_FVG_2.png" alt="FVG Trading" class="lesson-image" />
          </div>
          
          <div class="trading-concepts">
            <h4>Advanced FVG Concepts:</h4>
            
            <div class="concept-card">
              <h5>FVG Mitigation</h5>
              <img src="/images/Bearish_FVG_Reversal.png" alt="FVG Mitigation" class="concept-image" />
              <p>When price returns to partially or completely fill the gap, often providing reversal opportunities</p>
            </div>

            <div class="concept-card">
              <h5>FVG Inversion</h5>
              <img src="/images/Fair_Value_Gap_Inversion.png" alt="FVG Inversion" class="concept-image" />
              <p>When a bullish FVG becomes bearish support or a bearish FVG becomes bullish resistance</p>
            </div>

            <div class="concept-card">
              <h5>Consequent Encroachment</h5>
              <img src="/images/Consequent_Encroachment.png" alt="Consequent Encroachment" class="concept-image" />
              <p>The 50% level of an FVG, often acting as a precise reversal point</p>
            </div>
          </div>

          <div class="trading-strategies">
            <h4>FVG Trading Strategies:</h4>
            <div class="strategy-list">
              <div class="strategy-item">
                <h5>Gap Fill Strategy</h5>
                <p>Enter trades when price approaches an unfilled FVG with confluence</p>
              </div>
              <div class="strategy-item">
                <h5>Inversion Trades</h5>
                <p>Trade reversals when FVGs change polarity after being filled</p>
              </div>
              <div class="strategy-item">
                <h5>CE Precision Entry</h5>
                <p>Use the 50% level of FVGs for precise entry timing</p>
              </div>
            </div>
          </div>
        `,
        quiz: {
          question: "What is Consequent Encroachment in FVG analysis?",
          options: [
            "The top of a Fair Value Gap",
            "The 50% level of a Fair Value Gap",
            "The bottom of a Fair Value Gap",
            "A completely filled gap"
          ],
          correct: 2,
          explanation: "Consequent Encroachment (CE) is the 50% level of a Fair Value Gap, often providing precise reversal points for entries."
        }
      }
    }
  },

  "Fibonacci Analysis": {
    level: "intermediate", 
    icon: "fas fa-percentage",
    description: "Mathematical precision in market timing and targets",
    estimatedTime: "30 minutes",
    category: "technical-analysis",
    lessons: {
      "Fibonacci Foundations": {
        content: `
          <div class="lesson-intro">
            <p>Fibonacci retracements are based on mathematical relationships found in nature and markets, providing key support and resistance levels.</p>
            <img src="/images/OTE_Midpoint.png" alt="Fibonacci Basics" class="lesson-image" />
          </div>
          
          <div class="fibonacci-explanation">
            <h4>The Golden Ratio in Markets:</h4>
            <p>The Fibonacci sequence: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89...</p>
            <p>Key ratios derived from this sequence appear repeatedly in market movements.</p>
            
            <div class="fib-levels">
              <div class="fib-level level-236">
                <span class="level">23.6%</span>
                <span class="description">Shallow retracement - strong trends</span>
              </div>
              <div class="fib-level level-382">
                <span class="level">38.2%</span>
                <span class="description">Common retracement level</span>
              </div>
              <div class="fib-level level-500">
                <span class="level">50%</span>
                <span class="description">Psychological midpoint</span>
              </div>
              <div class="fib-level level-618">
                <span class="level">61.8%</span>
                <span class="description">Golden ratio - most significant</span>
              </div>
              <div class="fib-level level-786">
                <span class="level">78.6%</span>
                <span class="description">Deep retracement - weak trends</span>
              </div>
            </div>
          </div>

          <div class="application-section">
            <h4>Market Applications:</h4>
            <ul>
              <li><strong>Retracement Levels:</strong> Potential reversal points in trends</li>
              <li><strong>Extension Targets:</strong> Profit-taking levels beyond the original move</li>
              <li><strong>Time Analysis:</strong> Fibonacci time ratios for cycle analysis</li>
              <li><strong>Confluence Zones:</strong> Areas where multiple Fib levels align</li>
            </ul>
          </div>
        `,
        quiz: {
          question: "Which Fibonacci level is known as the 'Golden Ratio'?",
          options: [
            "38.2%",
            "50%",
            "61.8%",
            "78.6%"
          ],
          correct: 3,
          explanation: "61.8% is the Golden Ratio, mathematically derived from the Fibonacci sequence and considered the most significant retracement level."
        }
      },

      "Advanced Fibonacci Techniques": {
        content: `
          <div class="lesson-intro">
            <p>Master advanced Fibonacci applications including extensions, confluence analysis, and multi-timeframe alignment.</p>
            <img src="/images/OTE_Chart2.png" alt="Advanced Fibonacci" class="lesson-image" />
          </div>
          
          <div class="advanced-concepts">
            <h4>Fibonacci Extensions</h4>
            <p>Project potential targets beyond the original swing:</p>
            <ul>
              <li><strong>127.2%:</strong> First extension target</li>
              <li><strong>161.8%:</strong> Golden ratio extension (most reliable)</li>
              <li><strong>261.8%:</strong> Secondary extension target</li>
              <li><strong>423.6%:</strong> Extreme extension for major moves</li>
            </ul>

            <h4>Confluence Trading</h4>
            <p>The power of Fibonacci analysis multiplies when levels converge:</p>
            <ul>
              <li>Multiple timeframe retracement alignment</li>
              <li>Retracement and extension intersections</li>
              <li>Fibonacci + structure level confluence</li>
              <li>Time and price Fibonacci convergence</li>
            </ul>
          </div>

          <div class="practical-application">
            <h4>Professional Trading Setup:</h4>
            <div class="setup-steps">
              <div class="step">
                <h6>1. Identify the Swing</h6>
                <p>Find a clear impulse move with defined start and end points</p>
              </div>
              <div class="step">
                <h6>2. Apply Fibonacci</h6>
                <p>Draw from swing low to high (uptrend) or high to low (downtrend)</p>
              </div>
              <div class="step">
                <h6>3. Wait for Confluence</h6>
                <p>Look for price to approach key levels with additional confirmation</p>
              </div>
              <div class="step">
                <h6>4. Execute with Precision</h6>
                <p>Enter at confluent levels with tight stops and measured targets</p>
              </div>
            </div>
          </div>
        `,
        quiz: {
          question: "What makes a Fibonacci level more reliable for trading?",
          options: [
            "Using only the 61.8% level",
            "Confluence with other technical factors",
            "Only using it on daily charts",
            "Drawing it on every swing"
          ],
          correct: 2,
          explanation: "Fibonacci levels become more reliable when they confluence with other technical factors like structure levels, volume, or multiple timeframe alignment."
        }
      }
    }
  },

  // ====== ADVANCED STRATEGIES ======
  "Institutional Order Flow": {
    level: "advanced",
    icon: "fas fa-building",
    description: "Decode institutional trading patterns and order blocks",
    estimatedTime: "45 minutes",
    category: "institutional",
    lessons: {
      "Order Block Mastery": {
        content: `
          <div class="lesson-intro">
            <p>Order blocks represent zones where institutional traders have placed significant orders, creating powerful support and resistance areas.</p>
            <img src="/images/OrderBlock_InstitutionalSetup.png" alt="Order Blocks" class="lesson-image" />
          </div>
          
          <div class="orderblock-definition">
            <h4>Institutional Order Characteristics:</h4>
            <ul>
              <li><strong>Size:</strong> Large enough to influence market direction</li>
              <li><strong>Intent:</strong> Strategic positioning for major moves</li>
              <li><strong>Timing:</strong> Often placed during low volatility periods</li>
              <li><strong>Stealth:</strong> Hidden from retail trader visibility</li>
            </ul>
          </div>

          <div class="orderblock-types">
            <h4>Order Block Classifications:</h4>
            
            <div class="ob-type bullish">
              <h5>Bullish Order Block</h5>
              <img src="/images/OrderBlock_BOSSequence.png" alt="Bullish Order Block" class="ob-image" />
              <p>The last bearish candle before a Break of Structure (BOS) to the upside</p>
              <ul>
                <li>Institutional accumulation zone</li>
                <li>Strong buying interest present</li>
                <li>Acts as demand on retests</li>
              </ul>
            </div>

            <div class="ob-type bearish">
              <h5>Bearish Order Block</h5>
              <img src="/images/OrderBlock_HighProbability.png" alt="Bearish Order Block" class="ob-image" />
              <p>The last bullish candle before a Break of Structure (BOS) to the downside</p>
              <ul>
                <li>Institutional distribution zone</li>
                <li>Strong selling interest present</li>
                <li>Acts as supply on retests</li>
              </ul>
            </div>
          </div>

          <div class="probability-analysis">
            <h4>Order Block Probability Assessment:</h4>
            <img src="/images/OrderBlock_BullishFormation.png" alt="Probability Analysis" class="lesson-image" />
            <p>Not all order blocks are created equal. High-probability setups include:</p>
            <ul>
              <li>Fresh, untested order blocks</li>
              <li>Confluence with Fair Value Gaps</li>
              <li>Alignment with higher timeframe bias</li>
              <li>Volume confirmation during formation</li>
            </ul>
          </div>
        `,
        quiz: {
          question: "What defines a bullish order block?",
          options: [
            "Any bullish candle on the chart",
            "The last bearish candle before an upside BOS",
            "The highest candle in a move",
            "A random support level"
          ],
          correct: 2,
          explanation: "A bullish order block is specifically the last bearish candle (or series of bearish candles) before a Break of Structure to the upside, representing institutional buying."
        }
      },

      "Break of Structure Analysis": {
        content: `
          <div class="lesson-intro">
            <p>Break of Structure (BOS) signals are crucial for identifying institutional sentiment changes and order block validation.</p>
            <img src="/images/OrderBlock_OBandBOS.png" alt="BOS Analysis" class="lesson-image" />
          </div>
          
          <div class="bos-concepts">
            <h4>Understanding Break of Structure:</h4>
            
            <div class="concept-card">
              <h5>Bullish BOS</h5>
              <p>Price breaks above a previous significant high, indicating:</p>
              <ul>
                <li>Shift from bearish to bullish sentiment</li>
                <li>Institutional buying pressure</li>
                <li>Validation of bullish order blocks below</li>
                <li>Potential for trend continuation</li>
              </ul>
            </div>

            <div class="concept-card">
              <h5>Bearish BOS</h5>
              <p>Price breaks below a previous significant low, indicating:</p>
              <ul>
                <li>Shift from bullish to bearish sentiment</li>
                <li>Institutional selling pressure</li>
                <li>Validation of bearish order blocks above</li>
                <li>Potential for trend continuation</li>
              </ul>
            </div>
          </div>

          <div class="trading-framework">
            <h4>Order Block + BOS Trading Framework:</h4>
            <div class="framework-steps">
              <div class="step">
                <h6>1. Identify BOS</h6>
                <p>Locate clear breaks of previous highs/lows</p>
              </div>
              <div class="step">
                <h6>2. Mark Order Block</h6>
                <p>Identify the last opposing candle before BOS</p>
              </div>
              <div class="step">
                <h6>3. Wait for Retest</h6>
                <p>Price often returns to test the order block</p>
              </div>
              <div class="step">
                <h6>4. Enter with Confirmation</h6>
                <p>Enter when price respects the order block with rejection signals</p>
              </div>
            </div>
          </div>

          <div class="probability-chart">
            <h4>Order Block Probability Analysis:</h4>
            <img src="/images/OrderBlock_ProbabilityComparison.png" alt="Probability Comparison" class="lesson-image" />
            <p>Success rates vary based on setup quality, timeframe alignment, and market conditions.</p>
          </div>
        `,
        quiz: {
          question: "What should you wait for after identifying an order block?",
          options: [
            "Immediate entry",
            "Price to retest the order block zone",
            "The next day to trade",
            "Volume to increase"
          ],
          correct: 2,
          explanation: "After identifying an order block, traders should wait for price to return and retest the zone, often providing better entry opportunities with lower risk."
        }
      }
    }
  },

  "Market Manipulation & Psychology": {
    level: "advanced",
    icon: "fas fa-brain",
    description: "Understand how institutions manipulate retail traders",
    estimatedTime: "50 minutes", 
    category: "institutional",
    lessons: {
      "Institutional Manipulation Tactics": {
        content: `
          <div class="lesson-intro">
            <p>Understanding institutional manipulation tactics helps traders avoid traps and identify high-probability opportunities.</p>
            <img src="/images/OrderBlock_LowProbability.png" alt="Manipulation Tactics" class="lesson-image" />
          </div>
          
          <div class="manipulation-concepts">
            <h4>Common Manipulation Patterns:</h4>
            
            <div class="manipulation-type">
              <h5>Stop Hunts</h5>
              <p>Institutions deliberately trigger retail stop losses to:</p>
              <ul>
                <li>Create liquidity for their large orders</li>
                <li>Get better entry prices</li>
                <li>Remove weak hands from the market</li>
                <li>Fuel their intended directional move</li>
              </ul>
              <img src="/images/OrderBlock_ProbabilityComparison.png" alt="Stop Hunt Example" class="manipulation-image" />
            </div>

            <div class="manipulation-type">
              <h5>False Breakouts</h5>
              <p>Price appears to break key levels but quickly reverses:</p>
              <ul>
                <li>Attracts retail FOMO entries</li>
                <li>Provides exit liquidity for institutions</li>
                <li>Often occurs at major news events</li>
                <li>Creates opposite directional moves</li>
              </ul>
            </div>

            <div class="manipulation-type">
              <h5>Wyckoff Distribution/Accumulation</h5>
              <p>Systematic phases of institutional positioning:</p>
              <ul>
                <li><strong>Phase A:</strong> Stopping action and preliminary support/resistance</li>
                <li><strong>Phase B:</strong> Building cause through ranging action</li>
                <li><strong>Phase C:</strong> Spring (shakeout) or upthrust (final trap)</li>
                <li><strong>Phase D:</strong> Signs of strength/weakness emerging</li>
                <li><strong>Phase E:</strong> Markup or markdown begins</li>
              </ul>
            </div>
          </div>

          <div class="protection-strategies">
            <h4>Protection Strategies:</h4>
            <div class="strategy-grid">
              <div class="strategy-card">
                <h5>Wide Stops</h5>
                <p>Place stops beyond obvious levels to avoid stop hunts</p>
              </div>
              <div class="strategy-card">
                <h5>Multiple Timeframes</h5>
                <p>Confirm setups across different timeframes</p>
              </div>
              <div class="strategy-card">
                <h5>Volume Analysis</h5>
                <p>Use volume to distinguish real moves from fake ones</p>
              </div>
            </div>
          </div>
        `,
        quiz: {
          question: "What is the primary purpose of institutional stop hunts?",
          options: [
            "To create chart patterns",
            "To generate liquidity for large orders",
            "To help retail traders",
            "To increase market volatility"
          ],
          correct: 2,
          explanation: "Stop hunts are primarily designed to generate liquidity by triggering retail stop losses, allowing institutions to fill their large orders at better prices."
        }
      },

      "Smart Money Concepts": {
        content: `
          <div class="lesson-intro">
            <p>Smart Money Concepts (SMC) provide a framework for understanding how professional traders and institutions move markets.</p>
            <img src="/images/SwingLow.png" alt="Smart Money Concepts" class="lesson-image" />
          </div>
          
          <div class="smc-framework">
            <h4>Core SMC Principles:</h4>
            
            <div class="principle-card">
              <h5>Liquidity First</h5>
              <p>Markets move to areas of liquidity before trending in the intended direction</p>
              <div class="principle-details">
                <h6>Liquidity Locations:</h6>
                <ul>
                  <li>Above/below swing highs and lows</li>
                  <li>Equal highs and lows</li>
                  <li>Trendline breaks</li>
                  <li>Round number levels</li>
                </ul>
              </div>
            </div>

            <div class="principle-card">
              <h5>Market Structure Shifts</h5>
              <p>Institutional sentiment changes are reflected in structure breaks</p>
              <div class="principle-details">
                <h6>Key Signals:</h6>
                <ul>
                  <li>Break of Structure (BOS)</li>
                  <li>Change of Character (ChoCh)</li>
                  <li>Market Structure Break (MSB)</li>
                  <li>Inducement patterns</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="optimal-trade-entry">
            <h4>Optimal Trade Entry (OTE) Zones:</h4>
            <p>The 62-79% retracement zone where institutions often enter positions:</p>
            
            <div class="ote-examples">
              <div class="ote-card">
                <h5>Bullish OTE Setup</h5>
                <img src="/images/OTE_Long.png" alt="Bullish OTE" class="ote-image" />
                <p>After liquidity grab below, price returns to OTE zone for institutional buying</p>
              </div>

              <div class="ote-card">
                <h5>Bearish OTE Setup</h5>
                <img src="/images/OTE_Short.png" alt="Bearish OTE" class="ote-image" />
                <p>After liquidity grab above, price returns to OTE zone for institutional selling</p>
              </div>
            </div>

            <div class="ote-strategy">
              <h5>OTE Trading Process:</h5>
              <ol>
                <li>Identify liquidity sweep (stop hunt)</li>
                <li>Wait for price to return to 62-79% zone</li>
                <li>Look for rejection signals within OTE</li>
                <li>Enter in direction opposite to liquidity grab</li>
                <li>Target opposing liquidity pools</li>
              </ol>
            </div>
          </div>
        `,
        quiz: {
          question: "What percentage range defines the Optimal Trade Entry (OTE) zone?",
          options: [
            "50-61.8%",
            "62-79%",
            "78.6-88.6%",
            "23.6-38.2%"
          ],
          correct: 2,
          explanation: "The OTE zone is the 62-79% retracement area where institutions often enter positions after liquidity manipulation, providing high-probability entry opportunities."
        }
      }
    }
  },

  "Volume Profile & Analysis": {
    level: "advanced",
    icon: "fas fa-chart-bar",
    description: "Advanced volume analysis and market participation patterns",
    estimatedTime: "35 minutes",
    category: "technical-analysis", 
    lessons: {
      "Volume Imbalance Analysis": {
        content: `
          <div class="lesson-intro">
            <p>Volume imbalances reveal the true intentions of market participants and often precede significant price movements.</p>
            <img src="/images/VolumeImbalanceDefinition.png" alt="Volume Imbalance" class="lesson-image" />
          </div>
          
          <div class="volume-concepts">
            <h4>Understanding Volume Imbalance:</h4>
            
            <div class="concept-section">
              <h5>What Creates Volume Imbalance?</h5>
              <ul>
                <li><strong>Aggressive Buying:</strong> Market orders overwhelming ask side</li>
                <li><strong>Aggressive Selling:</strong> Market orders overwhelming bid side</li>
                <li><strong>Order Flow Disruption:</strong> Sudden changes in supply/demand</li>
                <li><strong>Institutional Activity:</strong> Large orders creating temporary gaps</li>
              </ul>
            </div>

            <div class="identification-section">
              <h5>Identifying Volume Imbalances:</h5>
              <ol>
                <li>Look for gaps between candle open/close prices</li>
                <li>Identify areas with overlapping candle shadows</li>
                <li>Observe volume spikes during gap formation</li>
                <li>Note the speed of price movement through levels</li>
              </ol>
            </div>
          </div>

          <div class="trading-applications">
            <h4>Trading Applications:</h4>
            <div class="application-grid">
              <div class="application-card">
                <h5>Gap Fill Trading</h5>
                <p>Price often returns to fill volume imbalances, providing entry opportunities</p>
              </div>
              <div class="application-card">
                <h5>Momentum Continuation</h5>
                <p>Multiple imbalances in same direction suggest strong momentum</p>
              </div>
              <div class="application-card">
                <h5>Reversal Signals</h5>
                <p>Exhaustion gaps often mark turning points in trends</p>
              </div>
            </div>
          </div>
        `,
        quiz: {
          question: "What typically happens to volume imbalances over time?",
          options: [
            "They disappear permanently",
            "Price often returns to fill them",
            "They only matter on daily charts",
            "They create new trends"
          ],
          correct: 2,
          explanation: "Volume imbalances often act as magnets for future price action, with price frequently returning to fill these inefficient areas."
        }
      },

      "Advanced Volume Patterns": {
        content: `
          <div class="lesson-intro">
            <p>Professional traders use sophisticated volume analysis to confirm price action and identify institutional activity.</p>
            <img src="/images/Bullish_FVG_VI_Gap_Comparison.png" alt="Volume Patterns" class="lesson-image" />
          </div>
          
          <div class="volume-patterns">
            <h4>Professional Volume Analysis:</h4>
            
            <div class="pattern-type">
              <h5>Volume-Price Divergence</h5>
              <div class="divergence-examples">
                <div class="divergence-card">
                  <h6>Bullish Divergence</h6>
                  <p>Price makes lower lows while volume makes higher lows</p>
                  <p><em>Suggests selling pressure is weakening</em></p>
                </div>
                <div class="divergence-card">
                  <h6>Bearish Divergence</h6>
                  <p>Price makes higher highs while volume makes lower highs</p>
                  <p><em>Suggests buying pressure is weakening</em></p>
                </div>
              </div>
            </div>

            <div class="pattern-type">
              <h5>Volume Confirmation Patterns</h5>
              <ul>
                <li><strong>Breakout Volume:</strong> High volume confirms genuine breakouts</li>
                <li><strong>Pullback Volume:</strong> Low volume pullbacks suggest trend continuation</li>
                <li><strong>Reversal Volume:</strong> Climactic volume often marks turning points</li>
                <li><strong>Accumulation Volume:</strong> Steady volume during consolidation</li>
              </ul>
            </div>
          </div>

          <div class="institutional-volume">
            <h4>Institutional Volume Signatures:</h4>
            <div class="signature-grid">
              <div class="signature-card">
                <h5>Smart Money Accumulation</h5>
                <ul>
                  <li>Volume increases on down days</li>
                  <li>Volume decreases on up days</li>
                  <li>Price holds above key support</li>
                  <li>Lack of follow-through on sell-offs</li>
                </ul>
              </div>
              <div class="signature-card">
                <h5>Smart Money Distribution</h5>
                <ul>
                  <li>Volume increases on up days</li>
                  <li>Volume decreases on down days</li>
                  <li>Price struggles at resistance</li>
                  <li>Lack of follow-through on rallies</li>
                </ul>
              </div>
            </div>
          </div>
        `,
        quiz: {
          question: "What does high volume during a breakout typically indicate?",
          options: [
            "The breakout will fail",
            "The breakout has strong conviction and participation",
            "It's a manipulation move",
            "Volume doesn't matter for breakouts"
          ],
          correct: 2,
          explanation: "High volume during a breakout indicates strong market conviction and participation, making the breakout more likely to be sustained rather than a false move."
        }
      }
    }
  },

  "Premium Scalping Strategies": {
    level: "advanced",
    icon: "fas fa-crown",
    description: "Elite scalping techniques for premium markets",
    estimatedTime: "40 minutes",
    category: "scalping",
    lessons: {
      "ICT Scalping Methodology": {
        content: `
          <div class="lesson-intro">
            <p>Master the Inner Circle Trader methodology for precision scalping in premium market conditions.</p>
            <img src="/images/OTE_Chart1.png" alt="ICT Methodology" class="lesson-image" />
          </div>
          
          <div class="ict-framework">
            <h4>ICT Scalping Framework:</h4>
            
            <div class="framework-component">
              <h5>Market Profile Analysis</h5>
              <ul>
                <li><strong>Asian Session:</strong> Range building and liquidity accumulation</li>
                <li><strong>London Open:</strong> Initial direction and momentum</li>
                <li><strong>New York Session:</strong> Institutional order flow and major moves</li>
                <li><strong>Lunch Hour:</strong> Consolidation and position adjustments</li>
              </ul>
            </div>

            <div class="framework-component">
              <h5>Premium/Discount Analysis</h5>
              <div class="premium-analysis">
                <div class="analysis-card">
                  <h6>Premium Zone Trading</h6>
                  <p>Upper portion of recent range - favor short entries</p>
                  <ul>
                    <li>Look for supply zones</li>
                    <li>Bearish order blocks</li>
                    <li>Sell-side liquidity runs</li>
                  </ul>
                </div>
                <div class="analysis-card">
                  <h6>Discount Zone Trading</h6>
                  <p>Lower portion of recent range - favor long entries</p>
                  <ul>
                    <li>Look for demand zones</li>
                    <li>Bullish order blocks</li>
                    <li>Buy-side liquidity runs</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div class="scalping-setups">
            <h4>High-Probability Scalping Setups:</h4>
            <div class="setup-grid">
              <div class="setup-card">
                <h5>Liquidity Sweep + OTE</h5>
                <p>Stop hunt followed by retracement to optimal trade entry zone</p>
              </div>
              <div class="setup-card">
                <h5>FVG Rejection</h5>
                <p>Price rejection from fair value gap with confluence</p>
              </div>
              <div class="setup-card">
                <h5>Order Block Mitigation</h5>
                <p>Price return to institutional order block for precision entry</p>
              </div>
            </div>
          </div>
        `,
        quiz: {
          question: "In ICT methodology, what characterizes premium zone trading?",
          options: [
            "Any area above the 50% level",
            "Upper portion of range where short entries are favored",
            "Only the highest price of the day",
            "Areas with high volume"
          ],
          correct: 2,
          explanation: "Premium zones represent the upper portion of a recent range where price is considered 'expensive' and short entries are typically favored due to the higher probability of mean reversion."
        }
      },

      "Multi-Timeframe Scalping": {
        content: `
          <div class="lesson-intro">
            <p>Achieve consistency in scalping by aligning multiple timeframes and understanding their individual roles.</p>
            <img src="/images/OTE_Chart3.png" alt="Multi-Timeframe Analysis" class="lesson-image" />
          </div>
          
          <div class="timeframe-hierarchy">
            <h4>Timeframe Hierarchy for Scalping:</h4>
            
            <div class="tf-level">
              <h5>Higher Timeframe (4H/Daily) - Bias</h5>
              <p>Determines the overall market direction and major levels</p>
              <ul>
                <li>Identify primary trend direction</li>
                <li>Mark major support/resistance levels</li>
                <li>Locate key order blocks and FVGs</li>
                <li>Determine premium/discount zones</li>
              </ul>
            </div>

            <div class="tf-level">
              <h5>Intermediate Timeframe (1H/30m) - Structure</h5>
              <p>Provides swing structure and entry zone identification</p>
              <ul>
                <li>Identify swing points and market structure</li>
                <li>Locate intermediate order blocks</li>
                <li>Find confluence zones</li>
                <li>Time entry opportunities</li>
              </ul>
            </div>

            <div class="tf-level">
              <h5>Lower Timeframe (5m/1m) - Execution</h5>
              <p>Precise entry timing and trade management</p>
              <ul>
                <li>Fine-tune entry signals</li>
                <li>Manage trade progression</li>
                <li>Scale out at targets</li>
                <li>Adjust stops dynamically</li>
              </ul>
            </div>
          </div>

          <div class="scalping-rules">
            <h4>Professional Scalping Rules:</h4>
            <div class="rules-grid">
              <div class="rule-card">
                <h5>Alignment Rule</h5>
                <p>All timeframes must agree on direction before entry</p>
              </div>
              <div class="rule-card">
                <h5>Confluence Rule</h5>
                <p>Minimum 3 confluent factors for each setup</p>
              </div>
              <div class="rule-card">
                <h5>Speed Rule</h5>
                <p>Quick decisions and execution - hesitation kills trades</p>
              </div>
              <div class="rule-card">
                <h5>Risk Rule</h5>
                <p>Maximum 0.5% risk per scalping trade</p>
              </div>
            </div>
          </div>

          <div class="execution-framework">
            <h4>Scalping Execution Framework:</h4>
            <ol>
              <li><strong>Pre-Market Analysis:</strong> Identify key levels and bias</li>
              <li><strong>Session Opening:</strong> Wait for liquidity sweeps</li>
              <li><strong>Setup Formation:</strong> Look for confluence entries</li>
              <li><strong>Entry Execution:</strong> Enter with tight stops</li>
              <li><strong>Management:</strong> Scale out at key levels</li>
              <li><strong>Exit Strategy:</strong> Close all positions at session end</li>
            </ol>
          </div>
        `,
        quiz: {
          question: "What is the maximum recommended risk per scalping trade?",
          options: [
            "1%",
            "0.5%",
            "2%",
            "5%"
          ],
          correct: 2,
          explanation: "For scalping, a maximum risk of 0.5% per trade is recommended due to the high frequency nature and the need to preserve capital across many trades."
        }
      }
    }
  }
};

// Utility functions for organized content management
export const getStudyTopics = () => {
  return Object.keys(studyContent);
};

export const getStudyTopic = (topicName) => {
  return studyContent[topicName];
};

export const getTopicsByCategory = () => {
  const categories = {
    foundations: [],
    'price-action': [],
    'technical-analysis': [],
    institutional: [],
    scalping: []
  };
  
  Object.entries(studyContent).forEach(([topicName, topicData]) => {
    const category = topicData.category || 'foundations';
    categories[category].push({
      name: topicName,
      ...topicData
    });
  });
  
  return categories;
};

export const getTopicsByDifficulty = () => {
  const difficulties = {
    beginner: [],
    intermediate: [],
    advanced: []
  };
  
  Object.entries(studyContent).forEach(([topicName, topicData]) => {
    difficulties[topicData.level].push({
      name: topicName,
      ...topicData
    });
  });
  
  return difficulties;
};

export const isTopicAccessible = (topicLevel, userSubscription, isAdmin = false) => {
  console.log('Checking access for level:', topicLevel, 'with subscription:', userSubscription, 'isAdmin:', isAdmin);
  
  // Admin users have access to all content
  if (isAdmin) return true;
  
  // Beginner content is always accessible
  if (topicLevel === 'beginner') return true;
  
  // All registered users (existing, promo, paid) can access intermediate and advanced content
  // Only unregistered users (free) are restricted to beginner content only
  if (['existing', 'promo', 'paid'].includes(userSubscription)) return true;
  
  return false;
};

export const getCategoryMetadata = () => {
  return {
    foundations: {
      title: "Trading Foundations",
      description: "Essential concepts every trader must master",
      icon: "fas fa-seedling",
      color: "#4CAF50"
    },
    'price-action': {
      title: "Price Action Mastery", 
      description: "Advanced market structure and swing analysis",
      icon: "fas fa-chart-line",
      color: "#2196F3"
    },
    'technical-analysis': {
      title: "Technical Analysis",
      description: "Mathematical and pattern-based trading methods",
      icon: "fas fa-calculator",
      color: "#FF9800"
    },
    institutional: {
      title: "Institutional Trading",
      description: "Decode professional trading strategies",
      icon: "fas fa-building",
      color: "#9C27B0"
    },
    scalping: {
      title: "Elite Scalping",
      description: "Premium high-frequency trading strategies",
      icon: "fas fa-crown",
      color: "#F44336"
    }
  };
};

export const getDifficultyMetadata = () => {
  return {
    beginner: {
      title: "Beginner Friendly",
      description: "Perfect starting point for new traders",
      icon: "fas fa-seedling",
      color: "#4CAF50",
      accessText: "Free Access"
    },
    intermediate: {
      title: "Intermediate Level",
      description: "For traders with basic knowledge",
      icon: "fas fa-chart-line", 
      color: "#FF9800",
      accessText: "Login Required"
    },
    advanced: {
      title: "Advanced Strategies",
      description: "Professional institutional techniques",
      icon: "fas fa-crown",
      color: "#F44336",
      accessText: "Login Required"
    }
  };
};
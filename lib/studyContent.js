export const studyContent = {
  "Market Structure & Swing Analysis": {
    level: "beginner",
    icon: "fas fa-chart-line",
    description: "Learn to identify key market structure points, swing highs and lows",
    estimatedTime: "30 minutes",
    lessons: {
      "Introduction to Market Structure": {
        content: `
          <div class="lesson-intro">
            <p>Market structure is the foundation of technical analysis. Understanding how markets move in patterns of highs and lows is crucial for successful trading.</p>
            <img src="/images/placeholder-chart.png" alt="Market Structure Example" class="lesson-image" />
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
      
      "Identifying Swing Points": {
        content: `
          <div class="lesson-intro">
            <p>Swing points are the building blocks of market structure. Learning to identify them accurately is essential for technical analysis.</p>
            <img src="/images/placeholder-chart.png" alt="Swing Points Example" class="lesson-image" />
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

      "Trend Analysis with Structure": {
        content: `
          <div class="lesson-intro">
            <p>Understanding trends through market structure allows you to trade with the momentum rather than against it.</p>
            <img src="/images/placeholder-chart.png" alt="Trend Analysis" class="lesson-image" />
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
      },

      "Swing Point Fundamentals": {
        content: `
          <div class="lesson-intro">
            <p>Swing points are critical levels on a price chart where the direction of the price changes. They are categorized as:</p>
            <img src="/images/placeholder-chart.png" alt="Swing Points Example" class="lesson-image" />
          </div>
          
          <div class="concept-section">
            <h4>What Are Swing Points?</h4>
            <ul>
              <li><strong>Swing Highs</strong>: Peaks where the price hits a high before reversing downward. A swing high is identified when a candle's high exceeds the highs of the candles immediately before and after it.</li>
              <li><strong>Swing Lows</strong>: Troughs where the price hits a low before reversing upward. A swing low occurs when a candle's low is less than the lows of the two surrounding candles.</li>
            </ul>
            <p>These points are foundational for chart analysis and trend identification in your app's charting exams.</p>
          </div>

          <div class="key-points">
            <h4>Why Swing Points Matter:</h4>
            <div class="point-grid">
              <div class="point-card">
                <h5>Define Trends</h5>
                <p>Higher swing highs and higher swing lows indicate an uptrend, while lower swing highs and lower swing lows signal a downtrend.</p>
              </div>
              <div class="point-card">
                <h5>Shape Market Structure</h5>
                <p>Swing points establish key support and resistance levels, often tested in your app's bias tests.</p>
              </div>
              <div class="point-card">
                <h5>Signal Reversals</h5>
                <p>A significant swing point can hint at a potential trend change when paired with other indicators.</p>
              </div>
            </div>
          </div>

          <div class="identification-process">
            <h4>How to Identify Swing Points:</h4>
            <ol>
              <li><strong>Find Turning Points</strong>: Look for candles where the price reverses direction.</li>
              <li><strong>Compare Neighboring Candles</strong>: For a swing high, confirm the candle's high is greater than the highs of the two adjacent candles. For a swing low, ensure the low is less than the lows of the two surrounding candles.</li>
              <li><strong>Filter Noise</strong>: Focus on prominent peaks and troughs, ignoring minor fluctuations that don't affect the broader trend.</li>
            </ol>
          </div>
        `,
        quiz: {
          question: "What does this chart indicate about Old High and Old Low levels?",
          options: [
            "They are simple support and resistance levels",
            "They represent trend reversal points", 
            "They are liquidity pools for institutional orders",
            "They are just previous price levels"
          ],
          correct: 3,
          explanation: "Old Highs and Old Lows represent significant liquidity pools where institutional orders gather, making them important targets for price movement. These levels often attract price action due to the concentration of stop losses or take profit orders from previous trades."
        }
      },

      "Advanced Swing Point Applications": {
        content: `
          <div class="lesson-intro">
            <p>Master the practical application of swing points for real trading scenarios.</p>
            <img src="/images/placeholder-chart.png" alt="Swing Point Applications" class="lesson-image" />
          </div>
          
          <div class="strategy-grid">
            <div class="strategy-card">
              <h5>Drawing Trendlines</h5>
              <p>Connect swing lows in an uptrend or swing highs in a downtrend to visualize the trend.</p>
              <ul>
                <li>Use at least 2 swing points</li>
                <li>More touches = stronger trendline</li>
                <li>Look for trendline breaks for reversal signals</li>
              </ul>
            </div>
            
            <div class="strategy-card">
              <h5>Setting Stop-Losses</h5>
              <p>Place stops just beyond swing points to limit risk while avoiding false triggers.</p>
              <ul>
                <li>For long trades: stops below swing lows</li>
                <li>For short trades: stops above swing highs</li>
                <li>Allow some buffer for market noise</li>
              </ul>
            </div>
            
            <div class="strategy-card">
              <h5>Entry/Exit Points</h5>
              <p>Use swing point bounces and breaks for precise timing.</p>
              <ul>
                <li>Buy bounces off swing lows in uptrends</li>
                <li>Sell rallies to swing highs in downtrends</li>
                <li>Enter on breaks of significant swing points</li>
              </ul>
            </div>
          </div>

          <div class="real-world-example">
            <h4>Real-World Example:</h4>
            <p>Consider Bitcoin on a daily chart:</p>
            <ul>
              <li><strong>Uptrend</strong>: Price drops to $40,000 (swing low), rises to $45,000 (swing high), falls to $42,000 (higher swing low), then climbs to $48,000 (higher swing high)—indicating an uptrend.</li>
              <li><strong>Downtrend</strong>: Price peaks at $50,000 (swing high), drops to $46,000 (swing low), rises to $48,000 (lower swing high), then falls to $43,000 (lower swing low)—signaling a downtrend.</li>
            </ul>
          </div>
        `,
        quiz: {
          question: "How many candles are required at minimum to confirm a valid swing high?",
          options: [
            "One candle",
            "Two candles", 
            "Three candles",
            "Five candles"
          ],
          correct: 3,
          explanation: "A valid swing high requires at least three candles - the center candle with the high point, plus one candle before and one after. The center candle's high must exceed the highs of both the preceding and following candles to be confirmed as a swing high."
        }
      }
    }
  },

  "Fibonacci Retracements": {
    level: "intermediate",
    icon: "fas fa-percentage",
    description: "Master Fibonacci levels for precise entry and exit points",
    estimatedTime: "45 minutes",
    lessons: {
      "Fibonacci Basics": {
        content: `
          <div class="lesson-intro">
            <p>Fibonacci retracements are based on mathematical relationships found in nature and markets. These levels often act as support and resistance.</p>
            <img src="/images/fib.jpg" alt="Fibonacci Example" class="lesson-image" />
          </div>
          
          <div class="fibonacci-explanation">
            <h4>The Fibonacci Sequence</h4>
            <p>The sequence: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89...</p>
            <p>Each number is the sum of the two preceding numbers.</p>
            
            <h4>Key Retracement Levels:</h4>
            <div class="fib-levels">
              <div class="fib-level level-236">
                <span class="level">23.6%</span>
                <span class="description">Shallow retracement</span>
              </div>
              <div class="fib-level level-382">
                <span class="level">38.2%</span>
                <span class="description">Common retracement</span>
              </div>
              <div class="fib-level level-500">
                <span class="level">50%</span>
                <span class="description">Midpoint retracement</span>
              </div>
              <div class="fib-level level-618">
                <span class="level">61.8%</span>
                <span class="description">Golden ratio</span>
              </div>
              <div class="fib-level level-786">
                <span class="level">78.6%</span>
                <span class="description">Deep retracement</span>
              </div>
            </div>
          </div>

          <div class="application-section">
            <h4>How to Apply Fibonacci:</h4>
            <ol>
              <li>Identify a clear trend move</li>
              <li>Draw from swing low to swing high (uptrend)</li>
              <li>Draw from swing high to swing low (downtrend)</li>
              <li>Watch for reactions at key levels</li>
            </ol>
          </div>
        `,
        quiz: {
          question: "What is the most significant Fibonacci retracement level known as the 'Golden Ratio'?",
          options: [
            "38.2%",
            "50%", 
            "61.8%",
            "78.6%"
          ],
          correct: 3,
          explanation: "61.8% is known as the Golden Ratio and is considered the most significant Fibonacci retracement level."
        }
      },

      "Advanced Fibonacci Techniques": {
        content: `
          <div class="lesson-intro">
            <p>Advanced Fibonacci techniques include extensions, confluence zones, and multiple timeframe analysis.</p>
            <img src="/images/placeholder-chart.png" alt="Advanced Fibonacci" class="lesson-image" />
          </div>
          
          <div class="advanced-concepts">
            <h4>Fibonacci Extensions</h4>
            <p>Used to project potential target levels beyond the original move:</p>
            <ul>
              <li>127.2% - First extension target</li>
              <li>161.8% - Golden ratio extension</li>
              <li>261.8% - Second extension target</li>
            </ul>

            <h4>Confluence Zones</h4>
            <p>Areas where multiple Fibonacci levels align:</p>
            <ul>
              <li>Multiple timeframe retracements</li>
              <li>Retracements and extensions overlap</li>
              <li>Previous structure levels</li>
            </ul>

            <h4>Time-Based Fibonacci</h4>
            <p>Using Fibonacci ratios for time analysis:</p>
            <ul>
              <li>Fibonacci time zones</li>
              <li>Fibonacci fans</li>
              <li>Fibonacci arcs</li>
            </ul>
          </div>

          <div class="trading-strategies">
            <h4>Trading Strategies:</h4>
            <div class="strategy-grid">
              <div class="strategy-card">
                <h5>Retracement Entry</h5>
                <p>Enter trades at key retracement levels in trending markets</p>
              </div>
              <div class="strategy-card">
                <h5>Extension Targets</h5>
                <p>Use extensions to set profit targets</p>
              </div>
              <div class="strategy-card">
                <h5>Confluence Trading</h5>
                <p>Trade at areas where multiple levels converge</p>
              </div>
            </div>
          </div>
        `,
        quiz: {
          question: "What is a confluence zone in Fibonacci analysis?",
          options: [
            "A single Fibonacci level",
            "An area where multiple Fibonacci levels align",
            "The 50% retracement level only",
            "A chart pattern"
          ],
          correct: 2,
          explanation: "A confluence zone is an area where multiple Fibonacci levels align, creating a stronger support or resistance area."
        }
      }
    }
  },

  "Fair Value Gaps (FVG)": {
    level: "intermediate", 
    icon: "fas fa-gap",
    description: "Understand institutional order flow through fair value gaps",
    estimatedTime: "40 minutes",
    lessons: {
      "Understanding Fair Value Gaps": {
        content: `
          <div class="lesson-intro">
            <p>Fair Value Gaps represent imbalances in market structure where price moved too quickly, leaving unfilled orders.</p>
            <img src="/images/placeholder-chart.png" alt="FVG Description" class="lesson-image" />
          </div>
          
          <div class="fvg-definition">
            <h4>What is a Fair Value Gap?</h4>
            <p>A Fair Value Gap (FVG) occurs when:</p>
            <ul>
              <li>Price moves rapidly through a level</li>
              <li>Leaves an imbalance in order flow</li>
              <li>Creates a gap that needs to be filled</li>
              <li>Represents institutional activity</li>
            </ul>
          </div>

          <div class="fvg-types">
            <h4>Types of Fair Value Gaps:</h4>
            
            <div class="fvg-type bullish">
              <h5>Bullish FVG</h5>
              <img src="/images/placeholder-chart.png" alt="Bullish FVG" class="fvg-image" />
              <p>Formed during upward price movement when buying pressure overwhelms sellers</p>
            </div>

            <div class="fvg-type bearish">
              <h5>Bearish FVG</h5>
              <img src="/images/placeholder-chart.png" alt="Bearish FVG" class="fvg-image" />
              <p>Formed during downward price movement when selling pressure overwhelms buyers</p>
            </div>
          </div>

          <div class="identification-rules">
            <h4>How to Identify FVGs:</h4>
            <ol>
              <li>Look for three consecutive candles</li>
              <li>Middle candle should be impulsive</li>
              <li>Gap between 1st and 3rd candle</li>
              <li>No overlap in their bodies/wicks</li>
            </ol>
          </div>
        `,
        quiz: {
          question: "How many consecutive candles are typically needed to form a Fair Value Gap?",
          options: [
            "Two candles",
            "Three candles",
            "Four candles",
            "Five candles"
          ],
          correct: 2,
          explanation: "A Fair Value Gap is typically formed by three consecutive candles where the middle candle is impulsive."
        }
      },

      "Trading with FVGs": {
        content: `
          <div class="lesson-intro">
            <p>Fair Value Gaps can be powerful tools for entries, exits, and understanding market sentiment.</p>
            <img src="/images/placeholder-chart.png" alt="FVG Trading" class="lesson-image" />
          </div>
          
          <div class="trading-concepts">
            <h4>FVG Trading Concepts:</h4>
            
            <div class="concept-card">
              <h5>Mitigation</h5>
              <p>When price returns to fill the gap partially or completely</p>
              <img src="/images/placeholder-chart.png" alt="FVG Mitigation" class="concept-image" />
            </div>

            <div class="concept-card">
              <h5>Inversion</h5>
              <p>When a bullish FVG becomes bearish or vice versa</p>
              <img src="/images/placeholder-chart.png" alt="FVG Inversion" class="concept-image" />
            </div>

            <div class="concept-card">
              <h5>Displacement</h5>
              <p>Strong movement that creates new FVGs and institutional interest</p>
              <img src="/images/placeholder-chart.png" alt="FVG Displacement" class="concept-image" />
            </div>
          </div>

          <div class="trading-strategies">
            <h4>FVG Trading Strategies:</h4>
            <div class="strategy-list">
              <div class="strategy-item">
                <h5>Retracement Entry</h5>
                <p>Enter trades when price retraces to mitigate an FVG in trending markets</p>
              </div>
              <div class="strategy-item">
                <h5>Breakout Confirmation</h5>
                <p>Use FVG formation to confirm breakouts and momentum shifts</p>
              </div>
              <div class="strategy-item">
                <h5>Target Setting</h5>
                <p>Use opposing FVGs as potential target areas</p>
              </div>
            </div>
          </div>

          <div class="risk-management">
            <h4>Risk Management with FVGs:</h4>
            <ul>
              <li>Stop loss beyond the FVG if trading retracement</li>
              <li>Partial profit taking at 50% FVG fill</li>
              <li>Monitor for FVG inversion signals</li>
              <li>Consider multiple timeframe FVG alignment</li>
            </ul>
          </div>
        `,
        quiz: {
          question: "What happens during FVG mitigation?",
          options: [
            "Price moves away from the gap",
            "Price returns to fill the gap partially or completely", 
            "The gap disappears permanently",
            "New gaps are created"
          ],
          correct: 2,
          explanation: "FVG mitigation occurs when price returns to fill the gap partially or completely, often providing trading opportunities."
        }
      }
    }
  },

  "Elliott Wave Theory": {
    level: "advanced",
    icon: "fas fa-water",
    description: "Master the complete Elliott Wave cycle for advanced market timing",
    estimatedTime: "60 minutes",
    lessons: {
      "Elliott Wave Fundamentals": {
        content: `
          <div class="lesson-intro">
            <p>Elliott Wave Theory describes how markets move in predictable patterns based on crowd psychology and natural cycles.</p>
            <img src="/images/placeholder-chart.png" alt="Elliott Wave Example" class="lesson-image" />
          </div>
          
          <div class="wave-basics">
            <h4>The Basic 8-Wave Cycle</h4>
            
            <div class="wave-structure">
              <h5>Impulse Waves (1-2-3-4-5)</h5>
              <div class="impulse-waves">
                <div class="wave-item">
                  <span class="wave-number">1</span>
                  <span class="wave-desc">Initial move - often weak</span>
                </div>
                <div class="wave-item">
                  <span class="wave-number">2</span>
                  <span class="wave-desc">Correction - can retrace deeply</span>
                </div>
                <div class="wave-item">
                  <span class="wave-number">3</span>
                  <span class="wave-desc">Strongest move - never shortest</span>
                </div>
                <div class="wave-item">
                  <span class="wave-number">4</span>
                  <span class="wave-desc">Consolidation - typically shallow</span>
                </div>
                <div class="wave-item">
                  <span class="wave-number">5</span>
                  <span class="wave-desc">Final move - often weakest</span>
                </div>
              </div>

              <h5>Corrective Waves (A-B-C)</h5>
              <div class="corrective-waves">
                <div class="wave-item">
                  <span class="wave-letter">A</span>
                  <span class="wave-desc">Initial correction move</span>
                </div>
                <div class="wave-item">
                  <span class="wave-letter">B</span>
                  <span class="wave-desc">Counter-trend bounce</span>
                </div>
                <div class="wave-item">
                  <span class="wave-letter">C</span>
                  <span class="wave-desc">Final correction move</span>
                </div>
              </div>
            </div>
          </div>

          <div class="elliott-rules">
            <h4>Elliott Wave Rules (Never Broken):</h4>
            <div class="rules-list">
              <div class="rule-item critical">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Wave 2 cannot retrace more than 100% of Wave 1</span>
              </div>
              <div class="rule-item critical">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Wave 3 cannot be the shortest of waves 1, 3, and 5</span>
              </div>
              <div class="rule-item critical">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Wave 4 cannot overlap with Wave 1 territory</span>
              </div>
            </div>
          </div>
        `,
        quiz: {
          question: "Which Elliott Wave rule states that Wave 3 cannot be the shortest?",
          options: [
            "Wave 2 cannot retrace more than 100% of Wave 1",
            "Wave 3 cannot be the shortest of waves 1, 3, and 5",
            "Wave 4 cannot overlap with Wave 1",
            "All corrective waves must be A-B-C"
          ],
          correct: 2,
          explanation: "Wave 3 cannot be the shortest of waves 1, 3, and 5 is one of the three inviolable Elliott Wave rules."
        }
      },

      "Wave Patterns and Corrections": {
        content: `
          <div class="lesson-intro">
            <p>Understanding different corrective patterns is crucial for accurate Elliott Wave analysis and trading timing.</p>
            <img src="/images/placeholder-chart.png" alt="Corrective Patterns" class="lesson-image" />
          </div>
          
          <div class="corrective-patterns">
            <h4>Types of Corrective Patterns:</h4>
            
            <div class="pattern-group">
              <h5>Simple Corrections</h5>
              <div class="pattern-card">
                <h6>Zigzag (5-3-5)</h6>
                <p>Sharp correction with Wave A = 5 waves, Wave B = 3 waves, Wave C = 5 waves</p>
                <ul>
                  <li>Most common in trending markets</li>
                  <li>Wave B typically retraces 38-78% of Wave A</li>
                  <li>Wave C often equals Wave A in length</li>
                </ul>
              </div>
            </div>

            <div class="pattern-group">
              <h5>Complex Corrections</h5>
              <div class="pattern-card">
                <h6>Flat (3-3-5)</h6>
                <p>Sideways correction where waves are more equal in size</p>
                <ul>
                  <li>Regular Flat: B = 90% of A, C = A</li>
                  <li>Expanded Flat: B > A, C > A</li>
                  <li>Running Flat: B > A, C < A</li>
                </ul>
              </div>

              <div class="pattern-card">
                <h6>Triangle</h6>
                <p>Five-wave consolidation pattern (A-B-C-D-E)</p>
                <ul>
                  <li>Each wave is three waves (3-3-3-3-3)</li>
                  <li>Converging or diverging boundaries</li>
                  <li>Usually appears in Wave 4 or Wave B</li>
                </ul>
              </div>
            </div>

            <div class="pattern-group">
              <h5>Combined Corrections</h5>
              <div class="pattern-card">
                <h6>Double Three (W-X-Y)</h6>
                <p>Two corrective patterns connected by an X wave</p>
              </div>
              <div class="pattern-card">
                <h6>Triple Three (W-X-Y-X-Z)</h6>
                <p>Three corrective patterns connected by X waves</p>
              </div>
            </div>
          </div>

          <div class="fibonacci-relationships">
            <h4>Fibonacci Relationships in Elliott Waves:</h4>
            <div class="fib-relationships">
              <div class="relationship-item">
                <span class="wave">Wave 2:</span>
                <span class="ratio">Often 50%, 61.8%, or 78.6% of Wave 1</span>
              </div>
              <div class="relationship-item">
                <span class="wave">Wave 3:</span>
                <span class="ratio">Often 161.8% or 261.8% of Wave 1</span>
              </div>
              <div class="relationship-item">
                <span class="wave">Wave 4:</span>
                <span class="ratio">Often 23.6% or 38.2% of Wave 3</span>
              </div>
              <div class="relationship-item">
                <span class="wave">Wave 5:</span>
                <span class="ratio">Often equals Wave 1 or 61.8% of Waves 1-3</span>
              </div>
            </div>
          </div>
        `,
        quiz: {
          question: "What type of corrective pattern has the structure 5-3-5?",
          options: [
            "Flat correction",
            "Triangle",
            "Zigzag correction",
            "Double three"
          ],
          correct: 3,
          explanation: "A Zigzag correction has the structure 5-3-5, making it the sharpest type of corrective pattern."
        }
      },

      "Advanced Elliott Wave Applications": {
        content: `
          <div class="lesson-intro">
            <p>Advanced Elliott Wave analysis includes multiple timeframe analysis, wave extensions, and practical trading applications.</p>
            <img src="/images/placeholder-chart.png" alt="Advanced Elliott Wave" class="lesson-image" />
          </div>
          
          <div class="advanced-concepts">
            <h4>Wave Extensions</h4>
            <p>When one of the impulse waves (1, 3, or 5) extends significantly beyond normal proportions:</p>
            
            <div class="extension-types">
              <div class="extension-card">
                <h5>Wave 1 Extension</h5>
                <p>Rare - usually occurs in commodity markets</p>
                <ul>
                  <li>Strong initial move</li>
                  <li>Waves 3 and 5 tend to be equal</li>
                  <li>Often followed by deep Wave 2</li>
                </ul>
              </div>

              <div class="extension-card">
                <h5>Wave 3 Extension</h5>
                <p>Most common - especially in strong trends</p>
                <ul>
                  <li>Powerful momentum move</li>
                  <li>Often 161.8% or 261.8% of Wave 1</li>
                  <li>Waves 1 and 5 tend to be equal</li>
                </ul>
              </div>

              <div class="extension-card">
                <h5>Wave 5 Extension</h5>
                <p>Common in blow-off tops/bottoms</p>
                <ul>
                  <li>Parabolic final move</li>
                  <li>Often followed by sharp reversal</li>
                  <li>May contain internal 5-wave structure</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="multiple-timeframes">
            <h4>Multiple Timeframe Analysis</h4>
            <p>Elliott Waves are fractal - they appear at all timeframes:</p>
            
            <div class="timeframe-strategy">
              <div class="tf-level">
                <h5>Higher Timeframe (Weekly/Monthly)</h5>
                <p>Identify major wave position and long-term trend direction</p>
              </div>
              <div class="tf-level">
                <h5>Intermediate Timeframe (Daily)</h5>
                <p>Confirm wave structure and identify key turning points</p>
              </div>
              <div class="tf-level">
                <h5>Lower Timeframe (4H/1H)</h5>
                <p>Fine-tune entries and exits within larger wave structure</p>
              </div>
            </div>
          </div>

          <div class="trading-applications">
            <h4>Practical Trading Applications:</h4>
            
            <div class="trading-scenarios">
              <div class="scenario-card">
                <h5>Wave 3 Breakout</h5>
                <p>Enter on break of Wave 1 high after Wave 2 completion</p>
                <ul>
                  <li>High probability setup</li>
                  <li>Stop below Wave 2 low</li>
                  <li>Target: 161.8% extension</li>
                </ul>
              </div>

              <div class="scenario-card">
                <h5>Wave 4 Correction Entry</h5>
                <p>Enter on completion of Wave 4 for Wave 5</p>
                <ul>
                  <li>Look for corrective structure</li>
                  <li>Fibonacci support levels</li>
                  <li>No overlap with Wave 1</li>
                </ul>
              </div>

              <div class="scenario-card">
                <h5>Wave 5 Completion</h5>
                <p>Prepare for reversal at Wave 5 targets</p>
                <ul>
                  <li>Divergence signals</li>
                  <li>Fibonacci projections</li>
                  <li>Begin looking for A-B-C down</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="common-mistakes">
            <h4>Common Elliott Wave Mistakes:</h4>
            <div class="mistake-list">
              <div class="mistake-item">
                <i class="fas fa-times-circle"></i>
                <span>Forcing wave counts to fit desired outcomes</span>
              </div>
              <div class="mistake-item">
                <i class="fas fa-times-circle"></i>
                <span>Ignoring the three cardinal rules</span>
              </div>
              <div class="mistake-item">
                <i class="fas fa-times-circle"></i>
                <span>Trading every wave instead of high-probability setups</span>
              </div>
              <div class="mistake-item">
                <i class="fas fa-times-circle"></i>
                <span>Not confirming with other technical analysis tools</span>
              </div>
            </div>
          </div>
        `,
        quiz: {
          question: "Which wave extension is most common in strong trending markets?",
          options: [
            "Wave 1 extension",
            "Wave 3 extension",
            "Wave 5 extension",
            "No extensions occur"
          ],
          correct: 2,
          explanation: "Wave 3 extensions are most common in strong trending markets, often reaching 161.8% or 261.8% of Wave 1."
        }
      }
    }
  },

  "Order Blocks & Institutional Trading": {
    level: "advanced",
    icon: "fas fa-building",
    description: "Understand how institutions move markets through order blocks",
    estimatedTime: "50 minutes",
    lessons: {
      "Introduction to Order Blocks": {
        content: `
          <div class="lesson-intro">
            <p>Order blocks represent areas where institutional traders have placed large orders, creating significant support or resistance zones.</p>
            <img src="/images/placeholder-chart.png" alt="Order Block Example" class="lesson-image" />
          </div>
          
          <div class="orderblock-definition">
            <h4>What is an Order Block?</h4>
            <p>An order block is a zone where:</p>
            <ul>
              <li>Institutional orders are concentrated</li>
              <li>Price showed a significant reaction</li>
              <li>Smart money entered or exited positions</li>
              <li>Future price reactions are likely</li>
            </ul>
          </div>

          <div class="orderblock-types">
            <h4>Types of Order Blocks:</h4>
            
            <div class="ob-type bullish">
              <h5>Bullish Order Block (Demand Zone)</h5>
              <img src="/images/placeholder-chart.png" alt="Bullish Order Block" class="ob-image" />
              <p>Characteristics:</p>
              <ul>
                <li>Forms before significant upward moves</li>
                <li>Shows strong buying interest</li>
                <li>Price typically rallies from this zone</li>
                <li>Can act as support on retests</li>
              </ul>
            </div>

            <div class="ob-type bearish">
              <h5>Bearish Order Block (Supply Zone)</h5>
              <img src="/images/placeholder-chart.png" alt="Bearish Order Block" class="ob-image" />
              <p>Characteristics:</p>
              <ul>
                <li>Forms before significant downward moves</li>
                <li>Shows strong selling interest</li>
                <li>Price typically falls from this zone</li>
                <li>Can act as resistance on retests</li>
              </ul>
            </div>
          </div>

          <div class="identification-criteria">
            <h4>How to Identify Order Blocks:</h4>
            <ol>
              <li>Look for the last opposing candle before a strong move</li>
              <li>Identify Break of Structure (BOS) confirmation</li>
              <li>Measure the body of the order block candle</li>
              <li>Watch for institutional behavior patterns</li>
            </ol>
          </div>
        `,
        quiz: {
          question: "What does a bullish order block represent?",
          options: [
            "An area of selling pressure",
            "A demand zone where institutions bought",
            "A random price level",
            "A chart pattern"
          ],
          correct: 2,
          explanation: "A bullish order block represents a demand zone where institutions accumulated long positions, creating support."
        }
      },

      "Order Block Trading Strategies": {
        content: `
          <div class="lesson-intro">
            <p>Effective order block trading requires understanding institutional behavior and market structure changes.</p>
            <img src="/images/placeholder-chart.png" alt="Order Block Trading" class="lesson-image" />
          </div>
          
          <div class="trading-concepts">
            <h4>Key Trading Concepts:</h4>
            
            <div class="concept-card">
              <h5>Break of Structure (BOS)</h5>
              <img src="/images/placeholder-chart.png" alt="Break of Structure" class="concept-image" />
              <p>A BOS occurs when price breaks above a previous high (bullish) or below a previous low (bearish), indicating a potential trend change.</p>
            </div>

            <div class="concept-card">
              <h5>Order Block Mitigation</h5>
              <p>When price returns to "fill" the order block by:</p>
              <ul>
                <li>Testing the zone for liquidity</li>
                <li>Allowing institutions to add to positions</li>
                <li>Providing retail entry opportunities</li>
                <li>Often resulting in reversal</li>
              </ul>
            </div>

            <div class="concept-card">
              <h5>Premium vs Discount</h5>
              <p>Understanding where price is relative to recent range:</p>
              <ul>
                <li>Premium: Upper portion of range (selling opportunities)</li>
                <li>Discount: Lower portion of range (buying opportunities)</li>
                <li>Order blocks in discount = higher probability longs</li>
                <li>Order blocks in premium = higher probability shorts</li>
              </ul>
            </div>
          </div>

          <div class="trading-strategies">
            <h4>Order Block Trading Strategies:</h4>
            
            <div class="strategy-list">
              <div class="strategy-item">
                <h5>Retracement Entry</h5>
                <p>Wait for price to retrace to order block after BOS</p>
                <div class="entry-criteria">
                  <h6>Entry Criteria:</h6>
                  <ul>
                    <li>Clear BOS confirmation</li>
                    <li>Price retraces to order block zone</li>
                    <li>Look for rejection signals (wicks, engulfing)</li>
                    <li>Enter on lower timeframe confirmation</li>
                  </ul>
                </div>
              </div>

              <div class="strategy-item">
                <h5>Breakout Strategy</h5>
                <p>Trade the initial break from order block</p>
                <div class="entry-criteria">
                  <h6>Entry Criteria:</h6>
                  <ul>
                    <li>Price accumulating in order block</li>
                    <li>Volume increase on breakout</li>
                    <li>Clear direction indicated</li>
                    <li>Stop loss within order block</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div class="risk-management">
            <h4>Risk Management:</h4>
            <div class="risk-rules">
              <div class="risk-rule">
                <h5>Stop Loss Placement</h5>
                <ul>
                  <li>Below order block for longs</li>
                  <li>Above order block for shorts</li>
                  <li>Account for spread and slippage</li>
                </ul>
              </div>
              <div class="risk-rule">
                <h5>Position Sizing</h5>
                <ul>
                  <li>Risk 1-2% per trade maximum</li>
                  <li>Larger zones = smaller positions</li>
                  <li>Higher probability setups = standard size</li>
                </ul>
              </div>
              <div class="risk-rule">
                <h5>Trade Management</h5>
                <ul>
                  <li>Take partial profits at key levels</li>
                  <li>Move stops to breakeven quickly</li>
                  <li>Trail stops based on structure</li>
                </ul>
              </div>
            </div>
          </div>
        `,
        quiz: {
          question: "What is a Break of Structure (BOS) in order block trading?",
          options: [
            "When price stays within a range",
            "When price breaks above a previous high or below a previous low",
            "When volume decreases",
            "When an order block forms"
          ],
          correct: 2,
          explanation: "A Break of Structure occurs when price breaks above a previous high (bullish BOS) or below a previous low (bearish BOS), indicating potential trend change."
        }
      }
    }
  },

  "Premium Trading Strategies": {
    level: "advanced",
    icon: "fas fa-crown",
    description: "Advanced institutional trading strategies and market manipulation",
    estimatedTime: "75 minutes",
    lessons: {
      "Market Manipulation Patterns": {
        content: `
          <div class="lesson-intro">
            <p>Understanding how institutions manipulate markets before major moves helps identify high-probability trading opportunities.</p>
            <img src="/images/placeholder-chart.png" alt="Market Manipulation" class="lesson-image" />
          </div>
          
          <div class="manipulation-concepts">
            <h4>Types of Market Manipulation:</h4>
            
            <div class="manipulation-type">
              <h5>Stop Hunt</h5>
              <p>Institutions push price to obvious stop loss levels to create liquidity:</p>
              <ul>
                <li>Target obvious support/resistance levels</li>
                <li>Trigger retail stop losses</li>
                <li>Accumulate positions at better prices</li>
                <li>Reverse quickly in intended direction</li>
              </ul>
              <img src="/images/placeholder-chart.png" alt="Stop Hunt Example" class="manipulation-image" />
            </div>

            <div class="manipulation-type">
              <h5>False Breakouts</h5>
              <p>Price appears to break key levels but reverses:</p>
              <ul>
                <li>Attracts retail FOMO entries</li>
                <li>Provides exit liquidity for institutions</li>
                <li>Often occurs at significant news events</li>
                <li>Creates opposite directional moves</li>
              </ul>
            </div>

            <div class="manipulation-type">
              <h5>Wyckoff Accumulation/Distribution</h5>
              <p>Systematic accumulation or distribution phases:</p>
              <ul>
                <li>Phase A: Stopping action</li>
                <li>Phase B: Building cause</li>
                <li>Phase C: Spring/Upthrust</li>
                <li>Phase D: Signs of strength/weakness</li>
                <li>Phase E: Markup/Markdown</li>
              </ul>
            </div>
          </div>

          <div class="manipulation-identification">
            <h4>How to Identify Manipulation:</h4>
            <div class="identification-signs">
              <div class="sign-item">
                <i class="fas fa-search"></i>
                <div>
                  <h6>Volume Analysis</h6>
                  <p>High volume on fake moves, low volume on real moves</p>
                </div>
              </div>
              <div class="sign-item">
                <i class="fas fa-clock"></i>
                <div>
                  <h6>Time of Day</h6>
                  <p>Often occurs during low liquidity periods</p>
                </div>
              </div>
              <div class="sign-item">
                <i class="fas fa-chart-line"></i>
                <div>
                  <h6>Price Action</h6>
                  <p>Rapid moves with immediate reversals</p>
                </div>
              </div>
              <div class="sign-item">
                <i class="fas fa-level-up-alt"></i>
                <div>
                  <h6>Level Quality</h6>
                  <p>Targeting obvious technical levels</p>
                </div>
              </div>
            </div>
          </div>
        `,
        quiz: {
          question: "What is the primary purpose of a stop hunt in market manipulation?",
          options: [
            "To create chart patterns",
            "To trigger retail stop losses and create liquidity",
            "To increase market volatility",
            "To provide news for analysts"
          ],
          correct: 2,
          explanation: "Stop hunts are designed to trigger retail stop losses, providing liquidity for institutions to enter positions at better prices."
        }
      },

      "Liquidity Concepts": {
        content: `
          <div class="lesson-intro">
            <p>Liquidity is the fuel that moves markets. Understanding where liquidity sits and how it's taken is crucial for professional trading.</p>
            <img src="/images/placeholder-chart.png" alt="Liquidity Concepts" class="lesson-image" />
          </div>
          
          <div class="liquidity-types">
            <h4>Types of Liquidity:</h4>
            
            <div class="liquidity-category">
              <h5>Buy Side Liquidity (BSL)</h5>
              <p>Orders sitting above current price:</p>
              <ul>
                <li>Stop losses from shorts</li>
                <li>Break-out buy orders</li>
                <li>Round number attractions</li>
                <li>Previous high levels</li>
              </ul>
              
              <h6>How Institutions Take BSL:</h6>
              <ul>
                <li>Push price above key highs</li>
                <li>Trigger stop losses and buy orders</li>
                <li>Use liquidity to fill large sell orders</li>
                <li>Often reverse price lower</li>
              </ul>
            </div>

            <div class="liquidity-category">
              <h5>Sell Side Liquidity (SSL)</h5>
              <p>Orders sitting below current price:</p>
              <ul>
                <li>Stop losses from longs</li>
                <li>Break-down sell orders</li>
                <li>Support level stops</li>
                <li>Previous low levels</li>
              </ul>
              
              <h6>How Institutions Take SSL:</h6>
              <ul>
                <li>Push price below key lows</li>
                <li>Trigger stop losses and sell orders</li>
                <li>Use liquidity to fill large buy orders</li>
                <li>Often reverse price higher</li>
              </ul>
            </div>
          </div>

          <div class="liquidity-zones">
            <h4>Identifying Liquidity Zones:</h4>
            
            <div class="zone-types">
              <div class="zone-card">
                <h5>Equal Highs/Lows</h5>
                <img src="/images/placeholder-chart.png" alt="Equal Highs and Lows" class="zone-image" />
                <p>Multiple touches at same level = liquidity resting</p>
              </div>

              <div class="zone-card">
                <h5>Old Highs/Lows</h5>
                <img src="/images/placeholder-chart.png" alt="Old Highs and Lows" class="zone-image" />
                <p>Previous significant levels where stops accumulate</p>
              </div>

              <div class="zone-card">
                <h5>Trendline Breaks</h5>
                <p>Obvious trendlines where breakout traders place stops</p>
              </div>

              <div class="zone-card">
                <h5>Round Numbers</h5>
                <p>Psychological levels (00, 50) where retail traders cluster orders</p>
              </div>
            </div>
          </div>

          <div class="optimal-trade-entry">
            <h4>Optimal Trade Entry (OTE)</h4>
            <p>The 62-79% retracement zone of a move, where institutions often enter:</p>
            
            <div class="ote-examples">
              <div class="ote-card">
                <h5>Bullish OTE</h5>
                <img src="/images/placeholder-chart.png" alt="Bullish OTE" class="ote-image" />
                <p>After liquidity grab below, price returns to 62-79% of the range for long entries</p>
              </div>

              <div class="ote-card">
                <h5>Bearish OTE</h5>
                <img src="/images/placeholder-chart.png" alt="Bearish OTE" class="ote-image" />
                <p>After liquidity grab above, price returns to 62-79% of the range for short entries</p>
              </div>
            </div>

            <div class="ote-strategy">
              <h5>OTE Trading Strategy:</h5>
              <ol>
                <li>Identify liquidity grab (stop hunt)</li>
                <li>Wait for price to return to OTE zone</li>
                <li>Look for rejection signals in the zone</li>
                <li>Enter in direction opposite to liquidity grab</li>
                <li>Target opposing liquidity or previous structure</li>
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
          explanation: "The Optimal Trade Entry (OTE) zone is the 62-79% retracement area where institutions often enter positions after liquidity grabs."
        }
      }
    }
  },

  "Liquidity Concepts": {
    level: "intermediate",
    icon: "fas fa-water",
    description: "Understand market liquidity and how institutions target these areas",
    estimatedTime: "40 minutes",
    lessons: {
      "Understanding Market Liquidity": {
        content: `
          <div class="lesson-intro">
            <p>Liquidity refers to the availability of buy and sell orders in the market. High liquidity areas are where large orders cluster, often around key levels like swing highs and lows.</p>
            <img src="/images/placeholder-chart.png" alt="Sellside Liquidity" class="lesson-image" />
          </div>
          
          <div class="concept-section">
            <h4>What is Liquidity in Trading?</h4>
            <p>Liquidity is important because:</p>
            <div class="point-grid">
              <div class="point-card">
                <h5>Affects Order Execution</h5>
                <p>High liquidity reduces slippage and improves fill quality.</p>
              </div>
              <div class="point-card">
                <h5>Attracts Price Movement</h5>
                <p>Price often moves toward liquidity pools to fill orders efficiently.</p>
              </div>
              <div class="point-card">
                <h5>Signals Institutional Activity</h5>
                <p>Large players target liquidity for better execution prices.</p>
              </div>
            </div>
          </div>

          <div class="liquidity-types">
            <h4>Types of Liquidity:</h4>
            <div class="point-grid">
              <div class="point-card">
                <h5>Buyside Liquidity</h5>
                <img src="/images/placeholder-chart.png" alt="Buyside Liquidity" class="lesson-image" />
                <p>Created by stop losses from short trades and buy orders clustered below swing lows.</p>
              </div>
              <div class="point-card">
                <h5>Sellside Liquidity</h5>
                <img src="/images/placeholder-chart.png" alt="Sellside Liquidity" class="lesson-image" />
                <p>Created by stop losses from long trades and sell orders clustered above swing highs.</p>
              </div>
            </div>
          </div>
        `,
        quiz: {
          question: "What type of orders create sellside liquidity as shown?",
          options: [
            "Stop losses from long trades",
            "Take profit from shorts",
            "Market buy orders",
            "Limit sell orders"
          ],
          correct: 1,
          explanation: "Sellside liquidity is created primarily by stop losses from long trades being clustered at certain levels, leading to sell orders when those levels are hit. This phenomenon can cause price to move significantly as these orders are executed."
        }
      },

      "Identifying Liquidity Pools": {
        content: `
          <div class="lesson-intro">
            <p>Learn to spot where institutional traders hunt for liquidity to improve their position entries.</p>
            <img src="/images/placeholder-chart.png" alt="Liquidity Hunting" class="lesson-image" />
          </div>
          
          <div class="identification-methods">
            <h4>How to Identify Liquidity Pools:</h4>
            <ol>
              <li><strong>Look at Swing Highs and Lows</strong>: These often have stop orders clustered above or below.</li>
              <li><strong>Observe Equal Highs or Lows</strong>: These can indicate stop-loss clusters.</li>
              <li><strong>Analyze Volume</strong>: High volume areas often coincide with liquidity.</li>
            </ol>
          </div>

          <div class="strategy-grid">
            <div class="strategy-card">
              <h5>Targeting Liquidity for Entries</h5>
              <p>Enter trades near liquidity pools where price might reverse.</p>
              <ul>
                <li>Wait for liquidity sweeps</li>
                <li>Look for immediate reversals</li>
                <li>Use as confirmation signals</li>
              </ul>
            </div>
            
            <div class="strategy-card">
              <h5>Setting Stops Beyond Liquidity</h5>
              <p>Place stop-losses outside of liquidity zones to avoid being swept.</p>
              <ul>
                <li>Identify obvious stop clusters</li>
                <li>Place stops beyond these areas</li>
                <li>Account for stop hunting behavior</li>
              </ul>
            </div>
            
            <div class="strategy-card">
              <h5>Watching for Liquidity Grabs</h5>
              <p>Be cautious of price moves that trigger stop orders before reversing.</p>
              <ul>
                <li>Sharp moves through levels</li>
                <li>Immediate reversals after sweeps</li>
                <li>Volume spikes at key levels</li>
              </ul>
            </div>
          </div>
        `,
        quiz: {
          question: "How can retail traders avoid having their stop orders caught in liquidity sweeps?",
          options: [
            "Never use stop losses",
            "Place stops at round numbers",
            "Place stops beyond obvious swing points", 
            "Use market orders instead of stop orders"
          ],
          correct: 3,
          explanation: "To avoid having stop orders caught in liquidity sweeps, retail traders should place their stops beyond obvious swing points rather than directly at them. Since institutions often target stops clustered at obvious levels, placing stops at a sufficient distance beyond these points increases the likelihood that the price would need to truly reverse to hit them."
        }
      }
    }
  },

  "Risk Management": {
    level: "intermediate", 
    icon: "fas fa-shield-alt",
    description: "Master position sizing, stop losses, and risk-reward ratios",
    estimatedTime: "35 minutes",
    lessons: {
      "Risk Management Fundamentals": {
        content: `
          <div class="lesson-intro">
            <p>Risk management involves strategies to minimize losses and protect capital. It's essential for long-term trading success.</p>
            <img src="/images/placeholder-chart.png" alt="Risk Reward Example" class="lesson-image" />
          </div>
          
          <div class="concept-section">
            <h4>Why Risk Management Matters:</h4>
            <div class="point-grid">
              <div class="point-card">
                <h5>Preserves Capital</h5>
                <p>Limits losses on individual trades to protect your account.</p>
              </div>
              <div class="point-card">
                <h5>Enhances Consistency</h5>
                <p>Helps maintain a steady equity curve over time.</p>
              </div>
              <div class="point-card">
                <h5>Reduces Emotional Stress</h5>
                <p>Provides a clear plan for handling losses and drawdowns.</p>
              </div>
            </div>
          </div>

          <div class="risk-techniques">
            <h4>Key Risk Management Techniques:</h4>
            <ol>
              <li><strong>Position Sizing</strong>: Determine how much to risk per trade (e.g., 1-2% of capital).</li>
              <li><strong>Stop-Loss Orders</strong>: Set predefined exit points to limit losses.</li>
              <li><strong>Risk-Reward Ratios</strong>: Aim for trades where potential reward outweighs risk (e.g., 1:3 ratio).</li>
            </ol>
          </div>
        `,
        quiz: {
          question: "What is the optimal risk:reward ratio shown for premium zone trades?",
          options: [
            "1:1",
            "1:2", 
            "1:3",
            "2:1"
          ],
          correct: 3,
          explanation: "The diagram shows a 1:3 risk:reward ratio as optimal for trades into premium zones. Trading in premium zones often involves higher risk, so a favorable reward ratio like 1:3 helps to justify the risk taken."
        }
      },

      "Position Sizing and Capital Protection": {
        content: `
          <div class="lesson-intro">
            <p>Learn the mathematical approach to consistent position sizing and capital preservation.</p>
            <img src="/images/placeholder-chart.png" alt="Position Sizing Formula" class="lesson-image" />
          </div>
          
          <div class="formula-section">
            <h4>Position Size Formula:</h4>
            <div class="formula-card">
              <h5>Position Size = (Account Size × Risk %) ÷ Stop-Loss Distance</h5>
              <p>This ensures consistent risk per trade regardless of stop distance.</p>
            </div>
          </div>

          <div class="example-section">
            <h4>Real-World Example:</h4>
            <p>If your account size is $10,000 and you risk 1% per trade, your maximum loss per trade is $100. If your stop-loss is $10 away from entry, you can trade 10 shares.</p>
            
            <div class="calculation-steps">
              <ol>
                <li>Account Size: $10,000</li>
                <li>Risk Percentage: 1% = $100</li>
                <li>Stop Distance: $10</li>
                <li>Position Size: $100 ÷ $10 = 10 shares</li>
              </ol>
            </div>
          </div>
          
          <div class="zone-comparison">
            <h4>Premium vs Discount Zone Trading:</h4>
            <div class="point-grid">
              <div class="point-card">
                <h5>Discount Zone (Long Trades)</h5>
                <p>Better risk:reward ratios due to buying at lower prices with higher upside potential.</p>
              </div>
              <div class="point-card">
                <h5>Premium Zone (Short Trades)</h5>
                <p>Ideal for shorting overbought conditions with good downside potential.</p>
              </div>
            </div>
          </div>
        `,
        quiz: {
          question: "According to proper risk management principles, how should position size be calculated?",
          options: [
            "Based on the trader's gut feeling",
            "Using a fixed percentage of account regardless of stop distance",
            "Using (Account Size × Risk %) ÷ Stop-Loss Distance",
            "Always using the maximum leverage available"
          ],
          correct: 3,
          explanation: "Proper risk management requires calculating position size using the formula: (Account Size × Risk %) ÷ Stop-Loss Distance. This ensures that each trade risks only a predetermined percentage of the account (typically 1-2%), adjusting position size based on the distance between entry and stop-loss to maintain consistent risk."
        }
      }
    }
  },

  "Volume Analysis": {
    level: "advanced",
    icon: "fas fa-chart-bar", 
    description: "Understand volume patterns and market participation",
    estimatedTime: "30 minutes",
    lessons: {
      "Volume Imbalance Fundamentals": {
        content: `
          <div class="lesson-intro">
            <p>Volume imbalance is a significant disparity between buying and selling activity, often causing rapid price shifts. It's visible through volume spikes on a chart.</p>
            <img src="/images/placeholder-chart.png" alt="Volume Analysis" class="lesson-image" />
          </div>
          
          <div class="concept-section">
            <h4>Why Volume Imbalance Matters:</h4>
            <div class="point-grid">
              <div class="point-card">
                <h5>Confirms Moves</h5>
                <p>High volume validates price trends and breakouts.</p>
              </div>
              <div class="point-card">
                <h5>Signals Reversals</h5>
                <p>Low volume during a move suggests weakness and potential reversal.</p>
              </div>
              <div class="point-card">
                <h5>Supports Breakouts</h5>
                <p>High volume breakouts are more sustainable and reliable.</p>
              </div>
            </div>
          </div>

          <div class="identification-methods">
            <h4>How to Detect Volume Imbalance:</h4>
            <ol>
              <li><strong>Analyze Volume Bars</strong>: Look for spikes well above average volume.</li>
              <li><strong>Pair with Price</strong>: High volume with a large candle confirms strong pressure.</li>
              <li><strong>Check Divergence</strong>: Rising price with falling volume may indicate a weakening trend.</li>
            </ol>
          </div>
        `,
        quiz: {
          question: "What does high volume during a price breakout indicate?",
          options: [
            "The breakout is likely to fail",
            "The breakout has strong conviction and is more likely to be sustainable",
            "Market manipulation is occurring",
            "Institutional traders are exiting their positions"
          ],
          correct: 2,
          explanation: "High volume during a price breakout indicates strong market conviction and participation, making the breakout more likely to be sustained. This shows genuine buying or selling pressure rather than a false move."
        }
      },

      "Volume Pattern Recognition": {
        content: `
          <div class="lesson-intro">
            <p>Learn to interpret different volume patterns and what they reveal about market sentiment.</p>
            <img src="/images/placeholder-chart.png" alt="Volume Patterns" class="lesson-image" />
          </div>
          
          <div class="pattern-analysis">
            <h4>Key Volume Patterns:</h4>
            
            <div class="strategy-grid">
              <div class="strategy-card">
                <h5>Volume Spike with Small Price Movement</h5>
                <p>Indicates absorption of selling or buying pressure at key levels.</p>
                <ul>
                  <li>Often occurs at support/resistance</li>
                  <li>Suggests institutional accumulation</li>
                  <li>May precede significant moves</li>
                </ul>
              </div>
              
              <div class="strategy-card">
                <h5>Declining Volume in Trends</h5>
                <p>Warning sign of potential trend weakness or exhaustion.</p>
                <ul>
                  <li>Decreasing participation</li>
                  <li>Loss of conviction</li>
                  <li>Potential reversal signal</li>
                </ul>
              </div>
              
              <div class="strategy-card">
                <h5>High Volume at Support/Resistance</h5>
                <p>Strong defense of important levels by market participants.</p>
                <ul>
                  <li>Increased probability of level holding</li>
                  <li>Shows institutional interest</li>
                  <li>Confirms level significance</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="application-section">
            <h4>Practical Applications:</h4>
            <ul>
              <li><strong>Confirming Entries</strong>: Trade when volume aligns with price direction.</li>
              <li><strong>Avoiding Traps</strong>: Skip moves with low volume that may reverse.</li>
              <li><strong>Spotting Reversals</strong>: Exit if volume diverges from price (e.g., price up, volume down).</li>
            </ul>
          </div>
        `,
        quiz: {
          question: "How can traders interpret declining volume during a price uptrend?",
          options: [
            "As confirmation the trend is healthy",
            "As a warning sign of potential trend weakness",
            "As an indication to increase position size", 
            "As a signal to hold positions longer"
          ],
          correct: 2,
          explanation: "Declining volume during a price uptrend should be interpreted as a warning sign of potential trend weakness. Healthy trends are typically accompanied by steady or increasing volume. When price continues higher but volume diminishes, it suggests decreasing participation and conviction, often preceding a correction or reversal."
        }
      }
    }
  }
};

export const getStudyTopics = () => {
  return Object.keys(studyContent);
};

export const getStudyTopic = (topicName) => {
  return studyContent[topicName];
};

export const isTopicAccessible = (topicLevel, userSubscription) => {
  console.log('Checking access for level:', topicLevel, 'with subscription:', userSubscription);
  if (topicLevel === 'beginner') return true;
  // Temporarily allow all intermediate content for testing
  if (topicLevel === 'intermediate') return true;
  if (topicLevel === 'advanced' && ['paid', 'promo', 'existing'].includes(userSubscription)) return true;
  return false;
};
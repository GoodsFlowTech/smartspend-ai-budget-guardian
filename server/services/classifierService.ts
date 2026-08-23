import { GoogleGenAI, Type } from '@google/genai';

export type IndianTransactionCategory = 'essential' | 'family_support' | 'insurance' | 'discretionary' | 'uncertain';

export interface ClassificationResult {
  category: IndianTransactionCategory;
  confidence: number;
  reasoning: string;
  suggestedSubcategory?: string;
  source: 'gemini' | 'heuristic_fallback';
}

export interface UserClassificationContext {
  cityTier?: string;
  numberOfChildren?: number;
  numberOfDependents?: number;
  monthlyIncome?: number;
}

export class ClassifierService {
  private static geminiClient: GoogleGenAI | null = null;

  private static getClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
      return null;
    }
    if (!this.geminiClient) {
      this.geminiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return this.geminiClient;
  }

  /**
   * Deterministic heuristic classifier ported from backend/app/classifier.py.
   * Matches Indian merchant patterns and payment gateway descriptors.
   */
  public static classifyWithHeuristics(merchantName: string, amount: number): ClassificationResult {
    const m = (merchantName || '').toLowerCase().trim();

    // 1. Explicit Uncertainty Isolation Rule
    if (
      /paytm\*\d{8,}/i.test(m) ||
      /upi\/\d{8,}\/p2p/i.test(m) ||
      m.includes('razorpay*misc') ||
      m.includes('cash_withdrawal') ||
      m.includes('bhim/ref') ||
      m.includes('temp_auth') ||
      m.includes('qr_scan_merchant') ||
      m.includes('imps/p2a') ||
      m.includes('payu*direct') ||
      m.includes('splitwise_settle') ||
      m.startsWith('unknown')
    ) {
      return {
        category: 'uncertain',
        confidence: 0.4,
        reasoning: `Ambiguous transaction descriptor '${merchantName}' lacks clear merchant/purpose metadata. Flagged for manual review.`,
        suggestedSubcategory: 'Manual Review Required',
        source: 'heuristic_fallback',
      };
    }

    // 2. Family & Dependent Support (check filial/parental remittance and hometown obligations)
    const familyKeywords = [
      'papa', 'father', 'maa', 'mother', 'dadi', 'dada', 'parents', 'parental', 'senior citizen',
      'elderly', 'geriatric', 'hometown', 'remittance', 'hostel', 'sister college', 'care for elders',
      'family support',
    ];
    if (familyKeywords.some((k) => m.includes(k)) && !m.includes('mother dairy')) {
      const isRemittance = ['papa', 'father', 'maa', 'mother', 'dadi', 'parents', 'parental', 'remittance', 'support', 'hometown'].some((k) => m.includes(k));
      return {
        category: 'family_support',
        confidence: 0.96,
        reasoning: `Identified filial/elderly dependent care or remittance obligation (${merchantName}).`,
        suggestedSubcategory: isRemittance ? 'Parental Remittance' : 'Elder Healthcare',
        source: 'heuristic_fallback',
      };
    }

    // 3. Discretionary Subscriptions & Lifestyle (handle 'netflix', 'spotify', etc.)
    const entertainmentKeywords = [
      'netflix', 'hotstar', 'spotify', 'prime video', 'youtube premium', 'apple music',
      'steam', 'playstation', 'xbox', 'pvr', 'inox', 'cinepolis', 'bookmyshow', 'zara',
      'h&m', 'starbucks', 'third wave', 'swiggy', 'zomato', 'cult.fit', 'nykaa', 'makemytrip',
      'resort', 'vacation', 'coffee', 'brewery', 'dining', 'restaurant', 'shopping',
    ];
    const isPubOrBar = /\b(pub|bar|club|lounge)\b/i.test(m);

    if (entertainmentKeywords.some((k) => m.includes(k)) || isPubOrBar) {
      let sub = 'Entertainment';
      if (['swiggy', 'zomato', 'starbucks', 'third wave', 'coffee', 'brewery', 'dining', 'restaurant'].some((k) => m.includes(k)) || isPubOrBar) {
        sub = 'Dining & Nightlife';
      } else if (['zara', 'h&m', 'nykaa', 'shopping'].some((k) => m.includes(k))) {
        sub = 'Shopping';
      } else if (['cult.fit'].some((k) => m.includes(k))) {
        sub = 'Fitness & Recreation';
      } else if (['makemytrip', 'resort', 'vacation'].some((k) => m.includes(k))) {
        sub = 'Travel & Leisure';
      }

      return {
        category: 'discretionary',
        confidence: 0.94,
        reasoning: `Identified lifestyle, dining, or non-essential discretionary expense (${merchantName}).`,
        suggestedSubcategory: sub,
        source: 'heuristic_fallback',
      };
    }

    // 4. Essential Groceries & Living (match 'mother dairy', 'tuition', etc.)
    const essentialKeywords = [
      'mother dairy', 'dmart', 'bigbasket', 'bescom', 'electricity', 'tata power', 'gas', 'mahanagar gas',
      'apollo pharmacy', 'medplus', 'pharmacy', 'petrol', 'indian oil', 'hpcl', 'bpcl', 'fuel',
      'metro', 'society maintenance', 'jiofiber', 'airtel', 'broadband',
      'blinkit', 'zepto', 'school', 'tuition', 'grocery', 'kirana', 'ration', 'cng', 'milk',
      'water bill', 'delhi public school',
    ];
    if (essentialKeywords.some((k) => m.includes(k))) {
      let sub = 'Groceries';
      if (['bescom', 'electricity', 'tata power', 'gas', 'jiofiber', 'broadband', 'water bill'].some((k) => m.includes(k))) {
        sub = 'Utilities';
      } else if (['pharmacy', 'apollo', 'medplus'].some((k) => m.includes(k))) {
        sub = 'Healthcare';
      } else if (['school', 'tuition', 'delhi public school'].some((k) => m.includes(k))) {
        sub = 'Education';
      } else if (['petrol', 'indian oil', 'hpcl', 'bpcl', 'fuel', 'metro', 'cng'].some((k) => m.includes(k))) {
        sub = 'Commute';
      }

      return {
        category: 'essential',
        confidence: 0.95,
        reasoning: `Identified essential household living expense (${merchantName}).`,
        suggestedSubcategory: sub,
        source: 'heuristic_fallback',
      };
    }

    // 5. Insurance & Protection
    const insuranceKeywords = [
      'lic', 'hdfc life', 'star health', 'care health', 'acko', 'icici prudential',
      'icici pru', 'niva bupa', 'go digit', 'max life', 'tata aig', 'insurance',
      'policybazaar', 'mediclaim', 'term life', 'health insurance', 'insurance premium', 'policy premium',
    ];
    if (insuranceKeywords.some((k) => m.includes(k))) {
      let sub = 'Insurance';
      if (m.includes('health') || m.includes('care') || m.includes('mediclaim')) sub = 'Health Insurance';
      else if (m.includes('life') || m.includes('lic') || m.includes('term')) sub = 'Term Life';
      else if (m.includes('car') || m.includes('two wheeler') || m.includes('acko')) sub = 'Vehicle Insurance';

      return {
        category: 'insurance',
        confidence: 0.98,
        reasoning: `Identified insurance provider or policy premium debit (${merchantName}).`,
        suggestedSubcategory: sub,
        source: 'heuristic_fallback',
      };
    }

    // Default fallback to uncertain if no pattern matched
    return {
      category: 'uncertain',
      confidence: 0.45,
      reasoning: `Unrecognized merchant or generic transaction string '${merchantName}'. Flagged as uncertain for safety.`,
      suggestedSubcategory: 'Unclassified',
      source: 'heuristic_fallback',
    };
  }

  /**
   * Classifies transaction with Gemini AI model (gemini-3.7-flash) with structured JSON schema.
   * Seamlessly falls back to heuristic classifier if GEMINI_API_KEY is missing or fails.
   */
  public static async classifyTransactionGemini(
    merchantName: string,
    amount: number,
    userProfile?: UserClassificationContext
  ): Promise<ClassificationResult> {
    const client = this.getClient();
    if (!client) {
      console.log(`[GeminiClassifier] GEMINI_API_KEY not configured or empty. Using deterministic heuristic classifier for '${merchantName}'.`);
      return this.classifyWithHeuristics(merchantName, amount);
    }

    try {
      const profileContext = userProfile
        ? `User Profile Context: City Tier: ${userProfile.cityTier || 'metro'}, Children: ${userProfile.numberOfChildren || 0}, Dependents: ${userProfile.numberOfDependents || 0}, Monthly Income: ₹${userProfile.monthlyIncome || 100000}.`
        : '';

      const systemInstruction = `You are an expert Indian Household Financial Guardian and Transaction Classifier.
Your task is to classify incoming Indian financial transactions into one of 5 strict categories:
1. 'essential' - Core living needs: Rent, groceries (DMart, BigBasket, Kirana, Blinkit milk/staples), utilities (electricity, gas, broadband), children's school tuition, healthcare/medicines (Apollo Pharmacy), commute fuel/metro pass.
2. 'family_support' - Filial and joint-family obligations: Direct remittances to parents/elders in hometowns, geriatric healthcare/physiotherapy, elder care nursing, hometown rent assistance, sibling college support.
3. 'insurance' - Fixed protection policies: Term life (LIC, HDFC Life, ICICI Pru, Max Life), health insurance (Star Health, Care, Niva Bupa), car/two-wheeler vehicle insurance (Acko, Go Digit), critical illness.
4. 'discretionary' - Lifestyle & leisure: Restaurant dining out, food delivery (Swiggy, Zomato), retail apparel (Zara, H&M), movies/events (PVR Inox, BookMyShow), OTT subscriptions (Netflix), boutique fitness (Cult.fit), vacations (MakeMyTrip), cafes (Starbucks).
5. 'uncertain' - Ambiguous, obfuscated, generic or low-confidence transactions (e.g. raw phone number P2P, masked payment gateway strings like 'PAYTM*98230', 'RAZORPAY*MISC', 'CASH_WITHDRAWAL', 'IMPS/SETTLEMENT').

CRITICAL INSTRUCTION: If confidence is below 0.65 or if the merchant name lacks deterministic identity, DO NOT GUESS. Return category as 'uncertain'.`;

      const prompt = `Classify this transaction:
Merchant Descriptor: "${merchantName}"
Amount: ₹${amount}
${profileContext}`;

      const generatePromise = client.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: {
                type: Type.STRING,
                description: 'Must be one of: essential, family_support, insurance, discretionary, uncertain',
              },
              confidence: {
                type: Type.NUMBER,
                description: 'Classification confidence score between 0.0 and 1.0',
              },
              reasoning: {
                type: Type.STRING,
                description: 'Detailed explanation justifying why this category was assigned.',
              },
              suggestedSubcategory: {
                type: Type.STRING,
                description: 'Specific subcategory like Groceries, Utilities, Elder Healthcare, Dining Out, etc.',
              },
            },
            required: ['category', 'confidence', 'reasoning'],
          },
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API call timed out after 2000ms')), 2000)
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);

      const text = response.text?.trim();
      if (!text) {
        console.warn(`[GeminiClassifier] Empty response received from Gemini for '${merchantName}'. Falling back to heuristics.`);
        return this.classifyWithHeuristics(merchantName, amount);
      }

      const data = JSON.parse(text);
      let cat: IndianTransactionCategory = data.category as IndianTransactionCategory;
      let conf = typeof data.confidence === 'number' ? data.confidence : 0.8;
      let reasoning = data.reasoning || '';
      const suggestedSubcategory = data.suggestedSubcategory;

      // Validate valid category enum
      const validCategories: IndianTransactionCategory[] = ['essential', 'family_support', 'insurance', 'discretionary', 'uncertain'];
      if (!validCategories.includes(cat)) {
        cat = 'uncertain';
      }

      // Enforce uncertainty rule for low confidence
      if (conf < 0.65 && cat !== 'uncertain') {
        cat = 'uncertain';
        reasoning += ' (Confidence below 0.65 threshold; flagged as uncertain for manual verification).';
      }

      return {
        category: cat,
        confidence: Number(conf.toFixed(2)),
        reasoning,
        suggestedSubcategory,
        source: 'gemini',
      };
    } catch (err: any) {
      console.warn(`[GeminiClassifier] Gemini API call failed for '${merchantName}': ${err.message}. Falling back to deterministic heuristic classifier.`);
      return this.classifyWithHeuristics(merchantName, amount);
    }
  }

  public static async classifyMerchant(
    merchantName: string,
    amount: number = 0,
    userProfile?: UserClassificationContext
  ): Promise<ClassificationResult> {
    return this.classifyTransactionGemini(merchantName, amount, userProfile);
  }

  public static classifyHeuristic(merchantName: string, amount: number = 0): ClassificationResult {
    return this.classifyWithHeuristics(merchantName, amount);
  }
}

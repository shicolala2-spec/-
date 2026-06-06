/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set high limits for base64 file payloads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Unified API endpoint to analyze any document & classify it automatically
  app.post("/api/invoices/analyze", async (req, res) => {
    try {
      const { fileBase64, fileName } = req.body;
      if (!fileBase64) {
        return res.status(400).json({ error: "لم يتم تقديم ملف للتحليل." });
      }

      if (!apiKey) {
        return res.status(500).json({ 
          error: "مفتاح API الخاص بـ Gemini غير مهيأ بالخادم. يرجى تفعيله في لوحة الأسرار (Secrets)." 
        });
      }

      // Handle Mime types and Base64 format extraction
      let mimeType = "image/png";
      let base64Data = fileBase64;

      const matches = fileBase64.match(/^data:([^;]+);base64,(.*)$/);
      if (matches && matches.length === 3) {
        mimeType = matches[1];
        base64Data = matches[2];
      } else {
        if (fileName) {
          const ext = fileName.split(".").pop()?.toLowerCase();
          if (ext === "pdf") {
            mimeType = "application/pdf";
          } else if (ext === "jpg" || ext === "jpeg") {
            mimeType = "image/jpeg";
          } else if (ext === "webp") {
            mimeType = "image/webp";
          }
        }
      }

      // Call Gemini 3.5 Flash to classify and extract
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          "قم بتحليل وتدقيق هذه الفاتورة أو الإيصال أو شهادة الوزن، وصنفها بدقة إما كمسند شراء (purchase) أو بيع (sale) أو مصروف تشغيلي (expense) واستخرج كافة قيم ومبالغ وتفاصيل المعاملة بدقة بالغة.",
        ],
        config: {
          systemInstruction: `أنت كبير المحاسبين والمدققين الماليين في شركة الهضبة لتجارة الخردة والمعادن بمصر.
مهمتك المحورية هي استلام إيصالات ومعاملات وفواتير الساحة (صور أو ملفات PDF) وتصنيفها كالتالي:
1. "purchase" (فاتورة شراء خردة واردة): عندما تقوم الشركة بشراء خردة (حديد، نحاس، صاج، ألومنيوم الخ) من تاجر أو مورد.
2. "sale" (فاتورة بيع خردة صادرة): عندما نبيع الخردة لمصانع حديد عز أو بشاي للصلب أو المصرية للمعادن.
3. "expense" (مصروف تشغيلي): مثل فواتير النولون والسيارات، يوميات الورشة والعمال، فواتير الكهرباء، الصيانة، الخ.

قواعد الاستخراج الدقيقة:
- قارن اسم العميل أو المورد الموجود مع قاعدة أسماء المستودع بمصر.
- طابق مواد الخردة مع معرّفات المواد الخمسة التالية بدقة، وحدد معرف الصنف المناسب ('itemId'):
  * 'it-1': حديد تسليح خردة (Rebar Scrap)
  * 'it-2': صاج حديد أسود ومجلفن (Iron Sheets)
  * 'it-3': نحاس أحمر كابلات (Bright Copper Wire)
  * 'it-4': ألومنيوم خردة طري (Soft Scrap Aluminum)
  * 'it-5': ستانلس ستيل خردة 304 (Stainless Steel 304)
- إذا كانت الفاتورة بالأوزان والأسعار لحديد أو نحاس إلخ، حوِّل أي وزن بالطن إلى الكيلوجرام بضربه في 1000 (مثال: 2.5 طن تساوي 2500 كجم) واكتب السعر بالنسبة للطن (مثال: سعر الكيلو 90 جنيه يعني سعر الطن 90,000 جنيه).
- أرجع النتيجة في الهيكل المناسب تماماً.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              transactionType: {
                type: Type.STRING,
                description: "النوع الحرفي للعمليات: 'purchase' أو 'sale' أو 'expense'"
              },
              confidenceReasoning: {
                type: Type.STRING,
                description: "بين يدي الفحص: شرح مفصل باللغة العربية للبيانات المستخرجة وسبب التصنيف"
              },
              expense: {
                type: Type.OBJECT,
                description: "تفاصيل المصروف وتملأ فقط إذا كان النوع expense",
                properties: {
                  amount: { type: Type.NUMBER, description: "إجمالي المبلغ كقيمة رقمية صافية" },
                  categoryKey: { type: Type.STRING, description: "أحد الكلمات: Transportation, Labor, Rent, Utilities, Commissions, Maintenance, Taxes, Other" },
                  subCategory: { type: Type.STRING, description: "التصنيف الفرعي المحدد بالعربية" },
                  description: { type: Type.STRING, description: "شرح المصروف والغرض منه باللغة العربية" },
                  date: { type: Type.STRING, description: "التاريخ بالصيغة القياسية YYYY-MM-DD" },
                  paymentMethod: { type: Type.STRING, description: "طريقة السداد: cash أو bank أو cheque" },
                  receiptNumber: { type: Type.STRING, description: "رقم الفاتورة أو الدفتر" },
                  supplierName: { type: Type.STRING, description: "اسم الجهة المستلمة للمال" },
                  notes: { type: Type.STRING, description: "أي ملاحظات إضافية" }
                }
              },
              invoice: {
                type: Type.OBJECT,
                description: "تفاصيل الفاتورة وتملأ إذا كان نوع المعاملة purchase أو sale",
                properties: {
                  partyName: { type: Type.STRING, description: "اسم الشريك التجاري المستلم أو المورد" },
                  date: { type: Type.STRING, description: "تاريخ الفاتورة بالصيغة YYYY-MM-DD" },
                  paymentType: { type: Type.STRING, description: "نوع السداد: cash أو credit" },
                  paidAmount: { type: Type.NUMBER, description: "المبلغ الذي تم سداده نقداً بالفعل" },
                  notes: { type: Type.STRING, description: "ملاحظات الفاتورة إن وجدت" },
                  details: {
                    type: Type.ARRAY,
                    description: "تفاصيل وتفصيلات المواد والحديد والنحاس الواردة في المستند",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        itemId: { type: Type.STRING, description: "معرف الصنف في المستودع: 'it-1', 'it-2', 'it-3', 'it-4', or 'it-5'" },
                        itemName: { type: Type.STRING, description: "اسم المادة بالعربية" },
                        weightKg: { type: Type.NUMBER, description: "الوزن المستخرج بالكيلوجرام (طابق بدقة!)" },
                        pricePerTon: { type: Type.NUMBER, description: "السعر المستهدف للطن الواحد (1000 كجم)" }
                      },
                      required: ["itemId", "itemName", "weightKg", "pricePerTon"]
                    }
                  }
                }
              }
            },
            required: ["transactionType", "confidenceReasoning"]
          }
        }
      });

      const textResult = response.text || "{}";
      try {
        const parsedData = JSON.parse(textResult.trim());
        res.json(parsedData);
      } catch {
        res.status(500).json({ 
          error: "فشلت عملية تهيئة وقراءة البيانات من مخرجات النموذج الذكي.", 
          raw: textResult 
        });
      }
    } catch (err: any) {
      console.error("AI Unified analyze error:", err);
      res.status(500).json({ error: err.message || "خطأ داخلي أثناء معالجة وقراءة الفاتورة." });
    }
  });

  // API endpoint to analyze invoices & receipts using AI (image or PDF)
  app.post("/api/expenses/analyze", async (req, res) => {
    try {
      const { fileBase64, fileName } = req.body;
      if (!fileBase64) {
        return res.status(400).json({ error: "لم يتم تقديم ملف للتحليل." });
      }

      if (!apiKey) {
        return res.status(500).json({ 
          error: "مفتاح API الخاص بـ Gemini غير مهيأ بالخادم. يرجى تفعيله في لوحة الأسرار (Secrets)." 
        });
      }

      // Handle Mime types and Base64 format extraction
      let mimeType = "image/png";
      let base64Data = fileBase64;

      const matches = fileBase64.match(/^data:([^;]+);base64,(.*)$/);
      if (matches && matches.length === 3) {
        mimeType = matches[1];
        base64Data = matches[2];
      } else {
        if (fileName) {
          const ext = fileName.split(".").pop()?.toLowerCase();
          if (ext === "pdf") {
            mimeType = "application/pdf";
          } else if (ext === "jpg" || ext === "jpeg") {
            mimeType = "image/jpeg";
          } else if (ext === "webp") {
            mimeType = "image/webp";
          }
        }
      }

      // Call Gemini with the invoice file and structured schemas
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          "قم بقراءة وتحليل هذه الفاتورة أو المستند بذكاء واستخرج جميع البيانات المالية والتنظيمية باللغة العربية كمسؤول حسابات لمستودع خردة ومعادن.",
        ],
        config: {
          systemInstruction: `أنت خبير حسابات وتدقيق في شركة الهضبة لتجارة الخردة والمعادن بمصر بمستوى احترافي عالي.
مهمتك هي قراءة إيصالات ومستندات وفواتير المصاريف المرفوعة (صور أو ملفات PDF) واستخراج قيم الحقول باللغة العربية بصيغة منظمة تماماً.

يجب مطابقة حقل التصنيف الرئيس 'categoryKey' بدقة تامة مع أحد التصنيفات الثمانية المدعومة بالنظام فقط:
- 'Transportation' (نقل وشحن)
- 'Labor' (عمالة)
- 'Rent' (إيجارات)
- 'Utilities' (مرافق)
- 'Commissions' (عمولات)
- 'Maintenance' (صيانة)
- 'Taxes' (ضرائب ورسوم)
- 'Other' (أخرى)

واختر تصنيفاً فرعياً مناسباً 'subCategory' باللغة العربية من الأمثلة الشائعة أو القريبة للمستند:
- Transportation: 'إيجار سيارات نقل'، 'وقود (سولار/بنزين)'، 'صيانة سيارات'، 'تحميل وتفريغ'
- Labor: 'رواتب شهرية'، 'مكافآت وحوافز'، 'أجر يومي (عمال موسميين)'
- Utilities: 'كهرباء'، 'مياه'، 'غاز'، 'إنترنت وتليفونات'
- Other: 'ضيافة'، 'قرطاسية'، 'سفر وانتقالات'، إلخ.

ضع المبلغ المستخرج في الحقل 'amount' كقيمة رقمية صافية.
استخرج التاريخ بالصيغة القياسية 'YYYY-MM-DD' في حقل 'date'.
اكتب وصفاً معبراً ودقيقاً للفاتورة في 'description'، واستخرج اسم المورد 'supplierName'، ورقم الإيصال 'receiptNumber'، وأية ملاحظات أخرى إضافية في حقل 'notes'.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              amount: {
                type: Type.NUMBER,
                description: "إجمالي المبلغ المستخرج كرقم"
              },
              categoryKey: {
                type: Type.STRING,
                description: "مفتاح التصنيف ويجب أن يكون حرفياً واحد من: 'Transportation', 'Labor', 'Rent', 'Utilities', 'Commissions', 'Maintenance', 'Taxes', 'Other'"
              },
              subCategory: {
                type: Type.STRING,
                description: "التصنيف الفرعي للمصروف باللغة العربية"
              },
              description: {
                type: Type.STRING,
                description: "وصف واضح ومختصر للمصروف باللغة العربية"
              },
              date: {
                type: Type.STRING,
                description: "التاريخ بالصيغة YYYY-MM-DD"
              },
              receiptNumber: {
                type: Type.STRING,
                description: "رقم الفاتورة أو الإيصال أو الدفتر إن وجد"
              },
              supplierName: {
                type: Type.STRING,
                description: "اسم الجهة المستفيدة أو المورد أو المحل"
              },
              notes: {
                type: Type.STRING,
                description: "أي ملاحظات محاسبية هامة إضافية"
              }
            },
            required: ["amount", "categoryKey", "subCategory", "description", "date"]
          }
        }
      });

      const textResult = response.text || "{}";
      try {
        const parsedData = JSON.parse(textResult.trim());
        res.json(parsedData);
      } catch {
        res.status(500).json({ 
          error: "فشلت عملية تهيئة وقراءة البيانات من مخرجات النموذج الذكي.", 
          raw: textResult 
        });
      }
    } catch (err: any) {
      console.error("AI analyze error:", err);
      res.status(500).json({ error: err.message || "خطأ داخلي أثناء معالجة وقراءة الفاتورة." });
    }
  });

  // Configure Vite or Serve SPA static files
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express custom server running on port ${PORT}`);
  });
}

startServer();

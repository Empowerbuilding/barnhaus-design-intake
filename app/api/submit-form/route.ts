import { NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface FormDataObject {
  name: string;
  email: string;
  phone: string;
  constructionBudget: string | number;
  propertyAddress: string;
  hasSurvey: string;
  hasSlope: string;
  padDirection: string;
  living: string;
  patios: string;
  garage: string;
  bedrooms: string;
  bathrooms: string;
  desiredRooms: Record<string, boolean>;
  roofStyle: string;
  ceilingHeight: string;
  kitchenFeatures: Record<string, boolean>;
  masterBathroom: Record<string, boolean>;
  masterCloset: Record<string, boolean>;
  countertopFinishes: Record<string, boolean>;
  flooringFinishes: Record<string, boolean>;
  fireplace: string;
  fireplaceType: Record<string, boolean>;
  porchLocations: Record<string, boolean>;
  patiosCovered: string;
  patioCeilingMaterial: string;
  waterHeater: string;
  insulationType: Record<string, boolean>;
  additionalRequests: string;
  additionalItems: string;
  unwantedItems: string;
  pinterestLink: string;
  [key: string]: unknown;
}

// ─── Security: Rate limiting store ──────────────────────────────────────────
// In-memory store. Resets on cold start in serverless environments.
// For production at scale, replace with Redis or a database-backed store.
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
}

// Periodically clean up expired entries to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(ip);
    }
  }
}, 10 * 60 * 1000); // every 10 minutes

// ─── Security: File validation constants ────────────────────────────────────

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const MAGIC_BYTES: Record<string, number[]> = {
  jpeg: [0xFF, 0xD8, 0xFF],
  png:  [0x89, 0x50, 0x4E, 0x47],
  gif:  [0x47, 0x49, 0x46, 0x38],
  webp: [0x52, 0x49, 0x46, 0x46], // RIFF header (WebP also has "WEBP" at offset 8)
};

const SUSPICIOUS_EXTENSIONS = ['.php', '.js', '.exe', '.sh', '.py', '.html', '.bat', '.cmd', '.ps1', '.jsp', '.asp', '.aspx', '.cgi', '.pl'];

const SUSPICIOUS_CONTENT_PATTERNS = ['<?php', '<script', 'eval(', 'exec(', 'base64_decode', 'system(', 'passthru(', 'shell_exec('];

const MIN_FORM_FILL_SECONDS = 10;

// ─── Security: Rejection logger ─────────────────────────────────────────────

function logRejection(ip: string, reason: string, details?: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    ip,
    reason,
    ...details,
  };
  console.warn('[SECURITY REJECTION]', JSON.stringify(entry));
}

// ─── Security: File validators ───────────────────────────────────────────────

function verifyMagicBytes(bytes: Uint8Array): boolean {
  for (const [format, signature] of Object.entries(MAGIC_BYTES)) {
    const matches = signature.every((byte, i) => bytes[i] === byte);
    if (matches) {
      // Additional check for WebP: bytes 8-11 must be "WEBP"
      if (format === 'webp') {
        const webpTag = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
        return webpTag === 'WEBP';
      }
      return true;
    }
  }
  return false;
}

function hasSuspiciousExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return SUSPICIOUS_EXTENSIONS.some(ext => lower.endsWith(ext) || lower.includes(ext + '.'));
}

function containsSuspiciousContent(bytes: Uint8Array): string | null {
  // Only scan the first 8KB to avoid performance issues on large files
  const scanLength = Math.min(bytes.length, 8192);
  const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, scanLength));
  const lower = text.toLowerCase();

  for (const pattern of SUSPICIOUS_CONTENT_PATTERNS) {
    if (lower.includes(pattern.toLowerCase())) {
      return pattern;
    }
  }
  return null;
}

function getClientIp(request: Request): string {
  const headers = new Headers(request.headers);
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

// ─── Supabase ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabase: SupabaseClient<any, 'public', any> | null = null;

function getSupabase() {
  if (!_supabase) {
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) as string;
    const supabaseKey = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY) as string;
    _supabase = createClient(supabaseUrl, supabaseKey);
  }
  return _supabase;
}

async function analyzeImageWithVision(imageUrl: string): Promise<Record<string, unknown>> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return {};
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this architectural inspiration image. Return ONLY a JSON object with keys: style (string), materials (string array), architectural_features (string array), color_palette (string), standout_elements (string array). No markdown, just raw JSON.' },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        }]
      })
    });
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    return JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
  } catch (e) {
    console.error('Vision analysis failed:', e);
    return {};
  }
}

async function uploadFileToSupabase(file: File, fileName: string) {
  const buffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);

  const supabase = getSupabase();
  const { data, error } = await supabase.storage
    .from('inspiration-images')
    .upload(fileName, uint8Array, {
      contentType: file.type,
      upsert: false
    });

  if (error) {
    console.error('File upload error:', error);
    throw error;
  }

  const { data: urlData } = getSupabase().storage
    .from('inspiration-images')
    .getPublicUrl(fileName);

  return {
    path: data.path,
    url: urlData.publicUrl,
    name: file.name,
    type: file.type,
    size: file.size
  };
}

// ─── POST handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const ip = getClientIp(request);

  try {
    // ── 1. Rate limiting ──────────────────────────────────────────────────
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      logRejection(ip, 'Rate limit exceeded');
      return NextResponse.json(
        { success: false, message: 'Too many submissions. Please try again later.' },
        { status: 429 }
      );
    }

    const formData = await request.formData();

    // ── 2. Honeypot check ─────────────────────────────────────────────────
    const honeypot = formData.get('_website');
    if (honeypot && String(honeypot).length > 0) {
      logRejection(ip, 'Honeypot field filled', { value: String(honeypot).slice(0, 100) });
      // Return 200 to not tip off the bot
      return NextResponse.json({ success: true, message: 'Form submitted successfully!' });
    }

    // ── 3. Time-based validation ──────────────────────────────────────────
    const formLoadedAt = formData.get('_loadTime') || formData.get('_formLoadedAt');
    if (formLoadedAt) {
      const loadedTimestamp = parseInt(String(formLoadedAt), 10);
      const elapsedSeconds = (Date.now() - loadedTimestamp) / 1000;

      if (elapsedSeconds < MIN_FORM_FILL_SECONDS) {
        logRejection(ip, 'Form submitted too quickly', { elapsedSeconds });
        return NextResponse.json(
          { success: false, message: 'Please take your time filling out the form.' },
          { status: 400 }
        );
      }
    }

    const formDataObj: FormDataObject = {} as FormDataObject;

    // Convert FormData to object and parse JSON strings
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('inspiration_image_')) {
        continue;
      } else if (key.startsWith('_')) {
        // Skip internal security fields
        continue;
      } else {
        try {
          formDataObj[key] = JSON.parse(value as string);
        } catch {
          formDataObj[key] = value;
        }
      }
    }

    // Validate required fields
    if (!formDataObj.constructionBudget ||
        (typeof formDataObj.constructionBudget === 'string' && formDataObj.constructionBudget.trim() === '') ||
        (typeof formDataObj.constructionBudget === 'number' && formDataObj.constructionBudget <= 0)) {
      return NextResponse.json(
        { success: false, message: 'Construction budget is required' },
        { status: 400 }
      );
    }

    // ── 4. File security validation ───────────────────────────────────────
    const imageFiles = Array.from(formData.entries())
      .filter(([key]) => key.startsWith('inspiration_image_'))
      .map(([_, value]) => value as File);

    for (const file of imageFiles) {
      // 4a. File size check
      if (file.size > MAX_FILE_SIZE) {
        logRejection(ip, 'File exceeds size limit', {
          fileName: file.name,
          fileSize: file.size,
          maxSize: MAX_FILE_SIZE,
        });
        return NextResponse.json(
          { success: false, message: `File "${file.name}" exceeds the 5MB size limit.` },
          { status: 400 }
        );
      }

      // 4b. Suspicious extension check
      if (hasSuspiciousExtension(file.name)) {
        logRejection(ip, 'Suspicious file extension', { fileName: file.name });
        return NextResponse.json(
          { success: false, message: `File "${file.name}" has a disallowed file extension.` },
          { status: 400 }
        );
      }

      // 4c. Magic bytes verification
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      if (bytes.length < 12) {
        logRejection(ip, 'File too small to be a valid image', { fileName: file.name, size: bytes.length });
        return NextResponse.json(
          { success: false, message: `File "${file.name}" is not a valid image.` },
          { status: 400 }
        );
      }

      if (!verifyMagicBytes(bytes)) {
        logRejection(ip, 'Invalid file magic bytes', {
          fileName: file.name,
          firstBytes: Array.from(bytes.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' '),
        });
        return NextResponse.json(
          { success: false, message: `File "${file.name}" is not a recognized image format (JPEG, PNG, GIF, or WebP required).` },
          { status: 400 }
        );
      }

      // 4d. Scan content for suspicious strings
      const suspiciousMatch = containsSuspiciousContent(bytes);
      if (suspiciousMatch) {
        logRejection(ip, 'Suspicious content in file', { fileName: file.name, pattern: suspiciousMatch });
        return NextResponse.json(
          { success: false, message: `File "${file.name}" contains disallowed content.` },
          { status: 400 }
        );
      }
    }

    // ── 5. Upload validated files ─────────────────────────────────────────
    const uploadedImages = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const fileName = `${Date.now()}-${i}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

      try {
        const uploadResult = await uploadFileToSupabase(file, fileName);
        uploadedImages.push(uploadResult);
      } catch (error) {
        console.error(`Failed to upload file ${fileName}:`, error);
      }
    }

    // ── 6. Run vision analysis on uploaded images ─────────────────────────
    const visionAnalysis: Record<string, unknown>[] = [];
    for (const img of uploadedImages) {
      const analysis = await analyzeImageWithVision(img.url);
      visionAnalysis.push({ image: img.name, url: img.url, ...analysis });
    }

    // ── 7. Save to database ───────────────────────────────────────────────
    const { data, error } = await getSupabase()
      .from('design_intake_submissions')
      .insert([
        {
          name: formDataObj.name,
          email: formDataObj.email,
          phone: formDataObj.phone,
          construction_budget: formDataObj.constructionBudget.toString(),
          property_address: formDataObj.propertyAddress,
          has_survey: formDataObj.hasSurvey,
          has_slope: formDataObj.hasSlope,
          pad_direction: formDataObj.padDirection,
          living: formDataObj.living,
          patios: formDataObj.patios,
          garage: formDataObj.garage,
          bedrooms: formDataObj.bedrooms,
          bathrooms: formDataObj.bathrooms,
          desired_rooms: formDataObj.desiredRooms,
          roof_style: formDataObj.roofStyle,
          ceiling_height: formDataObj.ceilingHeight,
          kitchen_features: formDataObj.kitchenFeatures,
          master_bathroom: formDataObj.masterBathroom,
          master_closet: formDataObj.masterCloset,
          countertop_finishes: formDataObj.countertopFinishes,
          flooring_finishes: formDataObj.flooringFinishes,
          fireplace: formDataObj.fireplace,
          fireplace_type: formDataObj.fireplaceType,
          porch_locations: formDataObj.porchLocations,
          patios_covered: formDataObj.patiosCovered,
          patio_ceiling_material: formDataObj.patioCeilingMaterial,
          water_heater: formDataObj.waterHeater,
          insulation_type: formDataObj.insulationType,
          additional_requests: formDataObj.additionalRequests,
          additional_items: formDataObj.additionalItems,
          unwanted_items: formDataObj.unwantedItems,
          pinterest_link: formDataObj.pinterestLink,
          inspiration_images: uploadedImages,
          vision_analysis: visionAnalysis,
          stories: formDataObj.stories,
          aesthetic_style: formDataObj.aestheticStyle,
          aesthetic_style_custom: formDataObj.aestheticStyleCustom,
          submitted_at: new Date().toISOString(),
          status: 'new'
        }
      ])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to save form data' },
        { status: 500 }
      );
    }

    // ── 9. Send notification email + fire n8n webhook ─────────────────────
    const payload = {
      id: data[0].id,
      client_name: formDataObj.name,
      client_email: formDataObj.email,
      client_phone: formDataObj.phone,
      budget: formDataObj.constructionBudget,
      stories: formDataObj.stories,
      aesthetic_style: formDataObj.aestheticStyle,
      living_sf: formDataObj.living,
      bedrooms: formDataObj.bedrooms,
      bathrooms: formDataObj.bathrooms,
      desired_rooms: formDataObj.desiredRooms,
      roof_style: formDataObj.roofStyle,
      ceiling_height: formDataObj.ceilingHeight,
      vision_analysis: visionAnalysis,
      image_count: uploadedImages.length,
      submitted_at: new Date().toISOString()
    };

    // Send Gmail notification using OAuth refresh token
    const sendGmailNotification = async () => {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
      const notifyEmail = 'mitchell@empowerbuilding.ai';
      if (!clientId || !clientSecret || !refreshToken) return;

      try {
        // Get fresh access token
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' })
        });
        const tokenData = await tokenRes.json() as { access_token?: string };
        if (!tokenData.access_token) return;

        const rooms = Object.entries((formDataObj.desiredRooms as Record<string,boolean>) || {})
          .filter(([,v]) => v).map(([k]) => k.replace(/([A-Z])/g, ' $1').trim()).join(', ') || 'None';
        const style = (formDataObj.aestheticStyle as string || 'Not specified').replace(/-/g, ' ');
        const visionText = visionAnalysis.length > 0
          ? (visionAnalysis as Record<string,unknown>[]).map(v => `- ${v.image}: ${v.style || ''} | Materials: ${(v.materials as string[] || []).join(', ')}`).join('\n')
          : 'No images uploaded';
        const shortId = (data[0].id as string).substring(0, 8);

        const emailBody = [
          `To: ${notifyEmail}`,
          `From: ${notifyEmail}`,
          `Subject: New Barnhaus Design Intake - ${formDataObj.name}`,
          `Content-Type: text/plain; charset=utf-8`,
          ``,
          `New design intake from ${formDataObj.name}`,
          ``,
          `CLIENT`,
          `Name: ${formDataObj.name}`,
          `Email: ${formDataObj.email}`,
          `Phone: ${formDataObj.phone}`,
          `Budget: ${formDataObj.constructionBudget}`,
          ``,
          `PROJECT`,
          `Stories: ${formDataObj.stories === 'two' ? 'Two Story' : 'Single Story'}`,
          `Style: ${style}`,
          `Living SF: ${formDataObj.living} | Garage: ${formDataObj.garage} | Patio: ${formDataObj.patios}`,
          `Bedrooms: ${formDataObj.bedrooms} | Bathrooms: ${formDataObj.bathrooms}`,
          `Roof: ${formDataObj.roofStyle} | Ceiling: ${formDataObj.ceilingHeight}ft`,
          `Special Rooms: ${rooms}`,
          ``,
          `AI VISION (${uploadedImages.length} images)`,
          visionText,
          ``,
          `Submission ID: ${data[0].id}`,
          `Reply "start revit ${shortId}" to begin the Revit model.`
        ].join('\n');

        const encoded = Buffer.from(emailBody).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
        await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${tokenData.access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw: encoded })
        });
      } catch (e) {
        console.error('Gmail notification failed:', e);
      }
    };
    sendGmailNotification();

    const webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL;
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(e => console.error('Webhook failed:', e));
    }

    return NextResponse.json({
      success: true,
      message: 'Form submitted successfully! Your submission has been saved.',
      id: data[0].id,
      images: uploadedImages.length
    });

  } catch (error: unknown) {
    console.error('Server error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while submitting the form. Please try again.'
      },
      { status: 500 }
    );
  }
}

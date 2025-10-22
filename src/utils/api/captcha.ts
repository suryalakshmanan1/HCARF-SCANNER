// Simple in-memory storage for demo (use database in production)
const captchaStore = new Map<string, { code: string; timestamp: number }>();

// Clean expired CAPTCHAs
const cleanExpiredCaptchas = () => {
  const now = Date.now();
  for (const [id, data] of captchaStore.entries()) {
    if (now - data.timestamp > 300000) { // 5 minutes
      captchaStore.delete(id);
    }
  }
};

const generateCaptchaCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'; // Removed confusing chars
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateCaptchaImage = (code: string): string => {
  // Create a simple SVG CAPTCHA
  const width = 150;
  const height = 50;
  const backgroundColor = '#f0f0f0';
  const textColor = '#333333';
  
  // Add some noise and distortion
  const noise = Array.from({ length: 20 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 2 + 1
  }));

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${backgroundColor}"/>
      
      <!-- Noise dots -->
      ${noise.map(dot => `<circle cx="${dot.x}" cy="${dot.y}" r="${dot.r}" fill="#ccc"/>`).join('')}
      
      <!-- Background lines -->
      <line x1="0" y1="${height/3}" x2="${width}" y2="${height*2/3}" stroke="#ddd" stroke-width="1"/>
      <line x1="0" y1="${height*2/3}" x2="${width}" y2="${height/3}" stroke="#ddd" stroke-width="1"/>
      
      <!-- CAPTCHA text -->
      <text x="50%" y="50%" font-family="monospace" font-size="24" font-weight="bold" 
            text-anchor="middle" dominant-baseline="middle" fill="${textColor}"
            transform="rotate(${Math.random() * 10 - 5} ${width/2} ${height/2})">
        ${code.split('').map((char, i) => 
          `<tspan dx="${i === 0 ? 0 : Math.random() * 8 - 4}" 
                  dy="${Math.random() * 6 - 3}"
                  transform="rotate(${Math.random() * 20 - 10})">${char}</tspan>`
        ).join('')}
      </text>
    </svg>
  `;

  // Use btoa for browser-compatible base64 encoding
  return btoa(svg);
};

export const generateCaptcha = () => {
  try {
    cleanExpiredCaptchas();
    
    const id = Math.random().toString(36).substring(2, 15);
    const code = generateCaptchaCode();
    const image = generateCaptchaImage(code);
    
    captchaStore.set(id, {
      code,
      timestamp: Date.now()
    });

    return { success: true, data: { id, image } };
  } catch (error) {
    console.error('CAPTCHA generation error:', error);
    return { success: false, error: 'Failed to generate CAPTCHA' };
  }
};

export const validateCaptcha = (id: string, answer: string) => {
  try {
    if (!id || !answer) {
      return { success: false, error: 'Missing required fields' };
    }

    const captchaData = captchaStore.get(id);
    
    if (!captchaData) {
      return { success: false, error: 'CAPTCHA not found or expired' };
    }

    // Check if expired (5 minutes)
    if (Date.now() - captchaData.timestamp > 300000) {
      captchaStore.delete(id);
      return { success: false, error: 'CAPTCHA expired' };
    }

    const isValid = captchaData.code.toUpperCase() === answer.toUpperCase();
    
    if (isValid) {
      captchaStore.delete(id); // Remove after successful validation
    }

    return { success: true, valid: isValid };
  } catch (error) {
    console.error('CAPTCHA validation error:', error);
    return { success: false, error: 'Failed to validate CAPTCHA' };
  }
};
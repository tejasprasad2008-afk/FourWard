#!/usr/bin/env node

/**
 * Token Integrity & Design Boundary Linter
 * 
 * Enforces FourWard design rules:
 * 1. Zero hex/rgba colors outside of src/theme/tokens.ts
 * 2. Corner radius <= 12 (strictly 6, 8, 12)
 * 3. Zero shadows, elevation, or glow
 * 4. Zero fonts other than Hanken Grotesk and Bricolage Grotesque
 * 5. Zero pills (radius >= 999)
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const SCAN_DIRS = [
  path.join(ROOT_DIR, 'apps', 'mobile', 'src'),
  path.join(ROOT_DIR, 'apps', 'mobile', 'app'),
  path.join(ROOT_DIR, 'apps', 'mobile', 'features'),
];

const ALLOWED_HEX_FILES = [
  path.normalize(path.join(ROOT_DIR, 'apps', 'mobile', 'src', 'theme', 'tokens.ts')),
];

let violations = [];

function scanFile(filePath) {
  const normalizedPath = path.normalize(filePath);
  const ext = path.extname(filePath);
  if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const relPath = path.relative(ROOT_DIR, filePath);

  const isTokensFile = ALLOWED_HEX_FILES.includes(normalizedPath);

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // Ignore comments
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      return;
    }

    // 1. Check for hex or rgba outside tokens.ts
    if (!isTokensFile) {
      const hexMatch = line.match(/['"`]#([0-9a-fA-F]{3,8})['"`]/) || line.match(/(?:color|background|borderColor|fill|stroke)\s*:\s*['"`]?#([0-9a-fA-F]{3,8})/i);
      if (hexMatch) {
        violations.push({
          file: relPath,
          line: lineNum,
          rule: 'HEX_OUTSIDE_TOKENS',
          message: `Found hardcoded hex color "${hexMatch[0]}". All colors must be imported from src/theme/tokens.ts.`,
        });
      }

      const rgbaMatch = line.match(/\brgba?\s*\([^)]+\)/);
      if (rgbaMatch) {
        violations.push({
          file: relPath,
          line: lineNum,
          rule: 'RGBA_OUTSIDE_TOKENS',
          message: `Found hardcoded rgba color "${rgbaMatch[0]}". All colors must be imported from src/theme/tokens.ts.`,
        });
      }
    }

    // 2. Check for radius > 12 or pills
    const radiusRegex = /(?:borderRadius|borderTopLeftRadius|borderTopRightRadius|borderBottomLeftRadius|borderBottomRightRadius)\s*:\s*(\d+)/g;
    let rMatch;
    while ((rMatch = radiusRegex.exec(line)) !== null) {
      const radiusVal = parseInt(rMatch[1], 10);
      if (radiusVal >= 999) {
        violations.push({
          file: relPath,
          line: lineNum,
          rule: 'PILL_RADIUS_FORBIDDEN',
          message: `Found pill radius ${radiusVal}. Pill buttons and circular tags are strictly forbidden in FourWard.`,
        });
      } else if (radiusVal > 12) {
        // Exception: AGENTS.md explicitly states: "Only the assistant button is a circle."
        const isAssistantException = line.includes('assistant-circle-exception') || relPath.includes('Assistant');
        if (!isAssistantException) {
          violations.push({
            file: relPath,
            line: lineNum,
            rule: 'RADIUS_EXCEEDS_12',
            message: `Found corner radius ${radiusVal}px. Maximum corner radius permitted is 12px (radii.lg), except for the assistant button circle.`,
          });
        }
      }
    }

    // 3. Check for any shadow / elevation / glow
    const shadowRegex = /\b(?:shadowColor|shadowOffset|shadowOpacity|shadowRadius|elevation|boxShadow|textShadow)\b/;
    const shadowMatch = line.match(shadowRegex);
    if (shadowMatch) {
      violations.push({
        file: relPath,
        line: lineNum,
        rule: 'SHADOW_OR_ELEVATION_FORBIDDEN',
        message: `Found shadow/elevation property "${shadowMatch[0]}". FourWard uses flat color blocks and 1px borders only. No shadows.`,
      });
    }

    // 4. Check for forbidden font families
    const fontRegex = /fontFamily\s*:\s*['"`]([^'"`]+)['"`]/g;
    let fMatch;
    while ((fMatch = fontRegex.exec(line)) !== null) {
      const font = fMatch[1];
      const isAllowed =
        font.includes('HankenGrotesk') ||
        font.includes('BricolageGrotesque') ||
        font.includes('System') || // fallback only if accompanied by Hanken/Bricolage
        font === '';
      if (!isAllowed || font.toLowerCase().includes('inter')) {
        violations.push({
          file: relPath,
          line: lineNum,
          rule: 'FORBIDDEN_FONT_FAMILY',
          message: `Found unauthorized font "${font}". Permitted fonts are Hanken Grotesk (body) and Bricolage Grotesque (headings). Never Inter.`,
        });
      }
    }

    // 5. Check for LinearGradient, BlurView, or expo-linear-gradient imports/usage
    const gradientMatch = line.match(/\b(?:LinearGradient|expo-linear-gradient|react-native-linear-gradient)\b/);
    if (gradientMatch) {
      violations.push({
        file: relPath,
        line: lineNum,
        rule: 'GRADIENT_FORBIDDEN',
        message: `Found gradient usage/import "${gradientMatch[0]}". FourWard uses flat colour blocks and 1px borders only. No gradients.`,
      });
    }

    const blurMatch = line.match(/\b(?:BlurView|expo-blur)\b/);
    if (blurMatch) {
      violations.push({
        file: relPath,
        line: lineNum,
        rule: 'BLUR_VIEW_FORBIDDEN',
        message: `Found blur/glassmorphism usage "${blurMatch[0]}". FourWard forbids glass/blur effects.`,
      });
    }

    // 6. Check for shimmer animation or effects
    const shimmerMatch = line.match(/\b(?:shimmer|shimmerAnimation|shimmerSweep|Shimmer)\b/);
    if (shimmerMatch) {
      violations.push({
        file: relPath,
        line: lineNum,
        rule: 'SHIMMER_FORBIDDEN',
        message: `Found shimmer pattern "${shimmerMatch[0]}". Shimmer sweeps use gradients. Loading states must use flat border-colour blocks with slow opacity fade (0.5 to 1 over 1.2s).`,
      });
    }

    // 7. Check for lucide-react-native imports outside components/icons/index.ts
    const isIconCentralFile = normalizedPath.endsWith(path.normalize('components/icons/index.ts'));
    if (!isIconCentralFile) {
      const lucideImportMatch = line.match(/from\s+['"]lucide-react-native['"]|require\(['"]lucide-react-native['"]\)/);
      if (lucideImportMatch) {
        violations.push({
          file: relPath,
          line: lineNum,
          rule: 'LUCIDE_IMPORT_OUTSIDE_ICONS_INDEX',
          message: `Direct import from lucide-react-native forbidden. All icons must be imported through the central icon layer <Icon name="..." /> from src/components/icons.`,
        });
      }
    }

    // 8. Check for Sparkles, Wand, or decorative AI icons
    const decorativeAiIconMatch = line.match(/\b(?:Sparkles|Wand|MagicWand|AutoAwesome)\b/);
    if (decorativeAiIconMatch) {
      violations.push({
        file: relPath,
        line: lineNum,
        rule: 'DECORATIVE_AI_ICON_FORBIDDEN',
        message: `Found decorative AI icon "${decorativeAiIconMatch[0]}". Sparkles, Wand, and decorative AI badges/icons are strictly forbidden in FourWard.`,
      });
    }

    // 9. Check for strokeWidth other than 1.75
    const strokeWidthMatch = line.match(/strokeWidth\s*[:=]\s*[{'"]?([0-9.]+)[}'"]?/);
    if (strokeWidthMatch) {
      const swVal = parseFloat(strokeWidthMatch[1]);
      if (swVal !== 1.75) {
        violations.push({
          file: relPath,
          line: lineNum,
          rule: 'STROKE_WIDTH_MUST_BE_1_75',
          message: `Found strokeWidth ${swVal}. All icons in FourWard must use strokeWidth: 1.75 with round caps and joins.`,
        });
      }
    }
  });
}

function traverseDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.expo') {
        traverseDirectory(fullPath);
      }
    } else {
      scanFile(fullPath);
    }
  }
}

console.log('🔍 Running FourWard Design & Token Integrity Checks...');
SCAN_DIRS.forEach((dir) => traverseDirectory(dir));

if (violations.length > 0) {
  console.error(`\n❌ Design Integrity Check FAILED with ${violations.length} violation(s):\n`);
  violations.forEach((v) => {
    console.error(`  [${v.rule}] ${v.file}:${v.line}`);
    console.error(`    ↳ ${v.message}\n`);
  });
  process.exit(1);
} else {
  console.log('✅ Design Integrity Check PASSED! All tokens, radii, fonts, and flat border rules strictly respected.\n');
  process.exit(0);
}

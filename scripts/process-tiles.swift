import Foundation
import AppKit

let brainDir = "/Users/tejasprasad/.gemini/antigravity-ide/brain/d9e593ae-1f9d-4157-9ff8-d4296ea7acda"
let outDir = "/Users/tejasprasad/FourWard/apps/mobile/assets/tiles"

let mapping: [(String, String)] = [
    ("triage_stethoscope_1792067353964.jpg", "triage_stethoscope.png"),
    ("records_lab_report_1792067381079.jpg", "records_lab_report.png"),
    ("prescriptions_pills_1792067435154.jpg", "prescriptions_pills.png"),
    ("hospital_bed_1792067463074.jpg", "hospital_bed.png"),
    ("diet_thali_1792067501715.jpg", "diet_thali.png"),
    ("maternal_booties_1792067531887.jpg", "maternal_booties.png"),
    ("family_access_1792067557939.jpg", "family_access.png"),
    ("security_consent_1792067586267.jpg", "security_consent.png")
]

for (srcName, dstName) in mapping {
    let srcPath = "\(brainDir)/\(srcName)"
    let dstPath = "\(outDir)/\(dstName)"
    
    guard let srcImage = NSImage(contentsOfFile: srcPath) else {
        print("Could not load \(srcPath)")
        continue
    }
    
    guard let tiffData = srcImage.tiffRepresentation,
          let bitmap = NSBitmapImageRep(data: tiffData) else {
        print("Could not get bitmap for \(srcPath)")
        continue
    }
    
    let width = bitmap.pixelsWide
    let height = bitmap.pixelsHigh
    
    // Create RGBA bitmap
    guard let rep = NSBitmapImageRep(
        bitmapDataPlanes: nil,
        pixelsWide: width,
        pixelsHigh: height,
        bitsPerSample: 8,
        samplesPerPixel: 4,
        hasAlpha: true,
        isPlanar: false,
        colorSpaceName: .calibratedRGB,
        bytesPerRow: width * 4,
        bitsPerPixel: 32
    ) else {
        print("Failed to create rep")
        continue
    }
    
    for y in 0..<height {
        for x in 0..<width {
            let color = bitmap.colorAt(x: x, y: y) ?? NSColor.white
            let r = color.redComponent
            let g = color.greenComponent
            let b = color.blueComponent
            
            // Calculate brightness
            let minC = min(r, min(g, b))
            if minC > 0.94 {
                // Fully transparent background
                rep.setColor(NSColor(red: r, green: g, blue: b, alpha: 0.0), atX: x, y: y)
            } else if minC > 0.88 {
                // Soft edge blend
                let alpha = (0.94 - minC) / (0.94 - 0.88)
                rep.setColor(NSColor(red: r, green: g, blue: b, alpha: alpha), atX: x, y: y)
            } else {
                rep.setColor(NSColor(red: r, green: g, blue: b, alpha: 1.0), atX: x, y: y)
            }
        }
    }
    
    guard let pngData = rep.representation(using: .png, properties: [:]) else {
        print("Failed to generate PNG for \(dstName)")
        continue
    }
    
    do {
        try pngData.write(to: URL(fileURLWithPath: dstPath))
        print("Saved \(dstPath)")
    } catch {
        print("Error saving \(dstPath): \(error)")
    }
}
print("Processing complete!")

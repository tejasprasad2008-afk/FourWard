import Foundation
import CoreGraphics
import ImageIO

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

let maskingColors: [CGFloat] = [235, 255, 235, 255, 235, 255]

for (srcName, dstName) in mapping {
    let srcURL = URL(fileURLWithPath: "\(brainDir)/\(srcName)")
    let dstURL = URL(fileURLWithPath: "\(outDir)/\(dstName)")
    
    guard let source = CGImageSourceCreateWithURL(srcURL as CFURL, nil),
          let cgImage = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
        print("Failed to load \(srcName)")
        continue
    }
    
    guard let maskedImage = cgImage.copy(maskingColorComponents: maskingColors) else {
        print("Failed to mask \(srcName)")
        continue
    }
    
    guard let destination = CGImageDestinationCreateWithURL(dstURL as CFURL, "public.png" as CFString, 1, nil) else {
        print("Failed to create destination for \(dstName)")
        continue
    }
    
    CGImageDestinationAddImage(destination, maskedImage, nil)
    CGImageDestinationFinalize(destination)
    print("Saved transparent cutout: \(dstName)")
}
print("Done!")

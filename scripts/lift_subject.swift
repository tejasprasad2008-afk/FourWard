import Foundation
import AppKit
import Vision
import CoreImage

func liftSubject(inputPath: String, outputPath: String) {
    guard let inputURL = URL(string: "file://" + inputPath),
          let ciImage = CIImage(contentsOf: inputURL) else {
        print("Failed to load \(inputPath)")
        return
    }

    if #available(macOS 14.0, *) {
        let request = VNGenerateForegroundInstanceMaskRequest()
        let handler = VNImageRequestHandler(ciImage: ciImage, options: [:])

        do {
            try handler.perform([request])
            guard let result = request.results?.first else {
                print("No foreground instance found in \(inputPath)")
                return
            }

            // Generate mask for all instances
            let maskPixelBuffer = try result.generateMaskedImage(
                ofInstances: result.allInstances,
                from: handler,
                croppedToInstancesExtent: false
            )

            let outputCIImage = CIImage(cvPixelBuffer: maskPixelBuffer)
            let context = CIContext(options: nil)
            guard let cgImage = context.createCGImage(outputCIImage, from: outputCIImage.extent) else {
                print("Failed to create CGImage")
                return
            }

            let bitmapRep = NSBitmapImageRep(cgImage: cgImage)
            guard let pngData = bitmapRep.representation(using: .png, properties: [:]) else {
                print("Failed to encode PNG")
                return
            }

            try pngData.write(to: URL(fileURLWithPath: outputPath))
            print("Successfully lifted subject for \(inputPath) -> \(outputPath)")
        } catch {
            print("Error: \(error)")
        }
    }
}

let args = CommandLine.arguments
if args.count >= 3 {
    liftSubject(inputPath: args[1], outputPath: args[2])
} else {
    print("Usage: lift_subject <input> <output>")
}

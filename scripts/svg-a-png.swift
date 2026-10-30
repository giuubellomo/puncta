// Pasa un SVG a PNG de un tamaño dado, con transparencia (AppKit lee SVG):
// swift scripts/svg-a-png.swift entrada.svg salida.png lado
import AppKit

let args = CommandLine.arguments
guard args.count == 4, let lado = Int(args[3]) else {
    FileHandle.standardError.write("uso: svg_a_png entrada.svg salida.png lado\n".data(using: .utf8)!)
    exit(1)
}
guard let imagen = NSImage(contentsOf: URL(fileURLWithPath: args[1])) else {
    FileHandle.standardError.write("no se pudo leer \(args[1])\n".data(using: .utf8)!)
    exit(1)
}
guard let rep = NSBitmapImageRep(
    bitmapDataPlanes: nil, pixelsWide: lado, pixelsHigh: lado, bitsPerSample: 8, samplesPerPixel: 4,
    hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0
) else { exit(1) }
rep.size = NSSize(width: lado, height: lado)
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
NSGraphicsContext.current?.imageInterpolation = .high
imagen.draw(in: NSRect(x: 0, y: 0, width: lado, height: lado), from: .zero, operation: .copy, fraction: 1)
NSGraphicsContext.restoreGraphicsState()
guard let png = rep.representation(using: .png, properties: [:]) else { exit(1) }
try png.write(to: URL(fileURLWithPath: args[2]))

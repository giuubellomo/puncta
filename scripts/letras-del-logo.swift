// Saca el contorno de cada letra de «puncta» de la fuente, a tamaño 100, como en la muestra:
// letter-spacing −2 y la n corrida 3. Imprime JSON: letra, x de la letra, el path SVG
// (y hacia abajo, la linea de base en 0) y su caja.
// swift scripts/letras-del-logo.swift node_modules/@expo-google-fonts/bricolage-grotesque/800ExtraBold/BricolageGrotesque_800ExtraBold.ttf
import CoreText
import Foundation

let ruta = CommandLine.arguments[1]
guard let descriptores = CTFontManagerCreateFontDescriptorsFromURL(URL(fileURLWithPath: ruta) as CFURL) as? [CTFontDescriptor],
      let descriptor = descriptores.first else { fatalError("no se pudo leer la fuente") }
let fuente = CTFontCreateWithFontDescriptor(descriptor, 100, nil)

let palabra = "puncta"
let atributos: [NSAttributedString.Key: Any] = [
    NSAttributedString.Key(kCTFontAttributeName as String): fuente,
    NSAttributedString.Key(kCTKernAttributeName as String): -2,
]
let linea = CTLineCreateWithAttributedString(NSAttributedString(string: palabra, attributes: atributos))
let corridas = CTLineGetGlyphRuns(linea) as! [CTRun]

func numero(_ v: CGFloat) -> String {
    let r = (Double(v) * 100).rounded() / 100
    return r == r.rounded() ? String(Int(r)) : String(r)
}

var letras: [[String: Any]] = []
var indice = 0
for corrida in corridas {
    let n = CTRunGetGlyphCount(corrida)
    var glifos = [CGGlyph](repeating: 0, count: n)
    var posiciones = [CGPoint](repeating: .zero, count: n)
    CTRunGetGlyphs(corrida, CFRange(location: 0, length: n), &glifos)
    CTRunGetPositions(corrida, CFRange(location: 0, length: n), &posiciones)
    for i in 0..<n {
        let caracter = String(Array(palabra)[indice])
        // La n y las que siguen, 3 mas a la derecha (la u y la n se pegaban).
        let x = posiciones[i].x + (indice >= 2 ? 3 : 0)
        var d = ""
        if let camino = CTFontCreatePathForGlyph(fuente, glifos[i], nil) {
            camino.applyWithBlock { elemento in
                let p = elemento.pointee.points
                switch elemento.pointee.type {
                case .moveToPoint: d += "M\(numero(p[0].x)) \(numero(-p[0].y))"
                case .addLineToPoint: d += "L\(numero(p[0].x)) \(numero(-p[0].y))"
                case .addQuadCurveToPoint:
                    d += "Q\(numero(p[0].x)) \(numero(-p[0].y)) \(numero(p[1].x)) \(numero(-p[1].y))"
                case .addCurveToPoint:
                    d += "C\(numero(p[0].x)) \(numero(-p[0].y)) \(numero(p[1].x)) \(numero(-p[1].y)) \(numero(p[2].x)) \(numero(-p[2].y))"
                case .closeSubpath: d += "Z"
                @unknown default: break
                }
            }
            let caja = camino.boundingBoxOfPath
            letras.append([
                "letra": caracter,
                "x": Double(numero(x))!,
                "d": d,
                // En y hacia abajo: arriba es −maxY.
                "caja": [Double(numero(caja.minX))!, Double(numero(-caja.maxY))!, Double(numero(caja.maxX))!, Double(numero(-caja.minY))!],
            ])
        }
        indice += 1
    }
}
let datos = try JSONSerialization.data(withJSONObject: letras, options: [.prettyPrinted, .sortedKeys])
print(String(data: datos, encoding: .utf8)!)

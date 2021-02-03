import Vector2 from "../Vector2";

export function textbox( c: CanvasRenderingContext2D, center: Vector2, text: string ) {
    c.font = "12px Arial"
    let metrics = c.measureText( text )
    let dx = -metrics.width / 2
    let dy = ( metrics.fontBoundingBoxAscent - metrics.fontBoundingBoxDescent ) / 2
    let w = metrics.width
    let h = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent
    let boxw = w + 3
    let boxh = h + 3
    c.beginPath()
    c.rect( center.x - boxw / 2, center.y - boxh / 2, boxw, boxh )
    c.fillStyle = "white"
    c.fill()
    c.lineWidth = 2
    c.stroke()
    c.fillStyle = "black"
    c.fillText( text, center.x + dx, center.y + dy )
}
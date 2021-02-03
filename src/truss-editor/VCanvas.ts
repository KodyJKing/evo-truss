import Vector2 from "../Vector2"

export default class VCanvas {
    static moveTo( c: CanvasRenderingContext2D, v: Vector2 ) { c.moveTo( v.x, v.y ) }
    static lineTo( c: CanvasRenderingContext2D, v: Vector2 ) { c.lineTo( v.x, v.y ) }
    static path( c: CanvasRenderingContext2D, ...paths: Vector2[][] ) {
        for ( let path of paths ) {
            VCanvas.moveTo( c, path[ 0 ] )
            for ( let i = 0; i < path.length; i++ ) VCanvas.lineTo( c, path[ i % path.length ] )
        }
    }
}
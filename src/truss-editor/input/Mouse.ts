import Vector2 from "../../Vector2"

export default class Mouse {
    pos: Vector2 = new Vector2( 0, 0 )
    rightDown = false
    leftDown = false
    constructor( target: HTMLElement ) {
        window.addEventListener( "contextmenu", e => e.preventDefault() )
        window.addEventListener( "mousedown", e => { this.leftDown = true } )
        window.addEventListener( "mouseup", e => this.leftDown = false )
        window.addEventListener( "mousemove", e => {
            let { top, left } = target.getBoundingClientRect()
            this.pos = new Vector2(
                e.clientX - left,
                e.clientY - top
            )
        } )
    }
}


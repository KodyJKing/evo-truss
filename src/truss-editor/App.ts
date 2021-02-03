import Mouse from "./input/Mouse"
import Vertex from "./gui/Vertex"
import Edge from "./gui/Edge"
import { GuiElement } from "./gui/GuiElement"
import Keyboard from "./input/Keyboard"
import Load from "./gui/Load"
import Vector2 from "../Vector2"
import { solveTruss, TrussEdge, TrussLoad, TrussReaction } from "../truss"
import SnapLine from "./SnapLine"
import { findMin } from "../util"

export default class App {
    canvas: HTMLCanvasElement
    c: CanvasRenderingContext2D
    mouse: Mouse
    keyboard: Keyboard = new Keyboard()

    vertices: Vertex[] = []
    edges: Edge[] = []
    loads: Load[] = []

    maxForce: number | null = null

    focusElement: GuiElement | null = null
    selectedElement: GuiElement | null = null
    dragElement: GuiElement | null = null

    static maxSelectDistance = 20
    static snapDistance = 10

    constructor() {
        this.canvas = document.getElementById( "canvas" ) as HTMLCanvasElement
        this.c = this.canvas.getContext( "2d" ) as CanvasRenderingContext2D
        this.mouse = new Mouse( this.canvas )
        this.resizeCanvas( 800, 800, 1 )
        this.canvas.addEventListener( "mousedown", ev => this.mousedown( ev ) )
        window.addEventListener( "keypress", ev => this.keypress( ev ) )
        this.mainLoop()
    }

    *elements() {
        for ( let elements of [ this.vertices, this.edges, this.loads ] )
            yield* elements
    }

    resizeCanvas( height, width, pixelDensity ) {
        this.canvas.style.width = width + "px"
        this.canvas.style.height = height + "px"
        this.canvas.width = width * pixelDensity
        this.canvas.height = height * pixelDensity
        this.canvas.getContext( "2d" )?.scale( pixelDensity, pixelDensity )
    }

    mainLoop() {
        this.update()
        requestAnimationFrame( () => this.mainLoop() )
    }

    update() {
        let { c, canvas } = this, { width, height } = canvas
        c.clearRect( 0, 0, width, height )

        this.updateDrag()

        this.focusElement = this.pickFocus()
        for ( let elements of [ this.loads, this.edges, this.vertices ] )
            for ( let element of elements )
                element.draw( this )

        this.solve()

        c.font = "12px Arial"
        let text = this.maxForce == null ? "system is unsolvable" : "max force = " + this.maxForce
        c.fillText( text, 5, 12 )
    }

    updateDrag() {
        let mousePos = this.mouse.pos
        if ( !this.mouse.leftDown )
            this.dragElement = null
        if ( this.dragElement != null ) {
            let snaplines = Array.from(
                SnapLine.distinct(
                    this.snaplines()
                )
            )
            let dragPosition = this.pickDragPoint( snaplines, mousePos )
            for ( let snapline of snaplines )
                snapline.draw( this, mousePos )
            this.dragElement.drag( this, dragPosition )
        }
    }

    *snaplines() {
        for ( let element of this.elements() )
            yield* element.snaplines( this )
    }

    pickDragPoint( snaplines: SnapLine[], mousePos: Vector2 ) {
        let intersections = SnapLine.intersections( snaplines )

        let minIntersection = findMin( intersections, ( point: Vector2 ) => {
            let distance = point.distance( mousePos )
            return distance > App.snapDistance ? Infinity : distance
        } )

        if ( minIntersection != undefined ) {
            return minIntersection
        } else {
            let minSnapLine = findMin( snaplines, line => {
                let distance = line.distance( mousePos )
                return distance > App.snapDistance ? Infinity : distance
            } )

            if ( minSnapLine != undefined )
                return minSnapLine.snappoint( mousePos )
            return mousePos
        }

    }

    mousedown( event ) {
        let { mouse, keyboard, focusElement, selectedElement } = this
        if ( event.button == 0 ) {
            if ( focusElement != null ) {
                if ( keyboard.get( "shift" ) )
                    this.dragElement = focusElement
                else
                    focusElement.mousedown( this )
            } else {
                if ( selectedElement instanceof Vertex && keyboard.get( "shift" ) ) {
                    this.loads.push( new Load( selectedElement, mouse.pos ) )
                    this.selectedElement = null
                } else {
                    let vertex = new Vertex( mouse.pos )
                    this.vertices.push( vertex )
                    if ( this.selectedElement != null )
                        vertex.mousedown( this )
                }
            }
        } else {
            this.selectedElement = null
            if ( focusElement != null )
                focusElement.remove( this )
        }
    }

    keypress( event: KeyboardEvent ) {
        if ( event.key == "s" )
            this.solve()
        this.focusElement?.keypress( this, event )
    }

    pickFocus(): GuiElement | null {
        let best: GuiElement | null = null, bestDist = Infinity
        let mousePos = this.mouse.pos

        let pickFrom = ( elements: GuiElement[] ) => {
            for ( let element of elements ) {
                let dist = element.distance( this, mousePos )
                if ( dist > App.maxSelectDistance )
                    continue
                if ( dist < bestDist ) {
                    best = element
                    bestDist = dist
                }
            }
        }

        pickFrom( this.vertices )
        if ( best == null )
            pickFrom( this.loads )
        if ( best == null )
            pickFrom( this.edges )

        return best
    }

    private solve() {
        let vertexNumbers = new Map<Vertex, number>()
        let vertexNum = 0
        let vertices: Vector2[] = []
        let reactions: TrussReaction[] = []
        for ( let vertex of this.vertices ) {
            for ( let reactionForce of vertex.reactions() )
                reactions.push( [ vertexNum, reactionForce ] )
            vertices.push( vertex.position )
            vertexNumbers.set( vertex, vertexNum )
            vertexNum++
        }

        let edges: TrussEdge[] = []
        for ( let edge of this.edges ) {
            let i = vertexNumbers.get( edge.a ), j = vertexNumbers.get( edge.b )
            if ( i == undefined || j == undefined )
                throw new Error( "Missing vertex." )
            edges.push( [ i, j ] )
        }

        let loads: TrussLoad[] = []
        for ( let load of this.loads ) {
            let i = vertexNumbers.get( load.vertex )
            let force = load.force()
            if ( i == undefined ) throw new Error( "Missing vertex." )
            loads.push( [ i, force ] )
        }

        let problem = { vertices, reactions, edges, loads }
        try {
            let solution = solveTruss( problem )
            this.maxForce = 0
            for ( let i = 0; i < this.edges.length; i++ ) {
                let tension = solution[ i ][ 0 ]
                this.edges[ i ].tension = tension
                this.maxForce = Math.max( this.maxForce ?? 0, Math.abs( tension ) )
            }
        } catch ( e ) {
            this.maxForce = null
            for ( let i = 0; i < this.edges.length; i++ )
                this.edges[ i ].tension = null
        }
    }
}

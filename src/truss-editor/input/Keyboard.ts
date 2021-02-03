export default class Keyboard {
    keys: Set<string> = new Set()
    constructor() {
        window.addEventListener( "keydown", ev => this.keys.add( ev.key.toLowerCase() ) )
        window.addEventListener( "keyup", ev => this.keys.delete( ev.key.toLowerCase() ) )
    }
    get( key: string ): boolean { return this.keys.has( key.toLowerCase() ) }
}
declare namespace alt1 {
    function identifyAppUrl(url: string): void;
    var skinName: string;
    // RS3 window bounds
    var rsX: number;
    var rsY: number;
    var rsWidth: number;
    var rsHeight: number;
    var rsLinked: boolean;
    // Mouse position packed as (x << 16 | y), -1 if outside RS3 window.
    // Use a1lib.getMousePosition() for {x,y} form.
    var mousePosition: number;
    // Overlay API
    function overLayRect(color: number, x: number, y: number, w: number, h: number, time: number, lineWidth: number): void;
    function overLayTextEx(msg: string, color: number, size: number, x: number, y: number, time: number, fontName: string, shadow: boolean, kerning: boolean): void;
    function overLayImage(x: number, y: number, imgstr: string, imgwidth: number, time: number): boolean;
    function overLaySetGroup(group: string): void;
    function overLayClearGroup(group: string): void;
    function overLayRefreshGroup(group: string): void;
    function overLayFreezeGroup(group: string): void;
    function overLayContinueGroup(group: string): void;
}

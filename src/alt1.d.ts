// Minimal type declarations for the alt1 global injected by Alt1 browser.
// Full types live in alt1/base wrapper.ts — this covers what we use directly.
declare namespace alt1 {
    function identifyAppUrl(url: string): void;
    var skinName: string;
}

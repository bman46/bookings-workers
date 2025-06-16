import { __decorate } from "tslib";
import { html, css, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
let SimpleGreeting = class SimpleGreeting extends LitElement {
    constructor() {
        super(...arguments);
        this.name = 'Somebody';
    }
    render() {
        return html `<p>Hello, ${this.name}!</p>`;
    }
};
SimpleGreeting.styles = css `p { color: blue }`;
__decorate([
    property()
], SimpleGreeting.prototype, "name", void 0);
SimpleGreeting = __decorate([
    customElement('simple-greeting')
], SimpleGreeting);
export { SimpleGreeting };
//# sourceMappingURL=simple-greeting.js.map
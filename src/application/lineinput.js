const blessed = require('blessed')
const unicode = require('blessed/lib/unicode');
const Node = blessed.widget.node
const Textarea = blessed.widget.textarea

/**
 * Lineinput
 */

function Lineinput(options) {
    if (!(this instanceof Node)) {
        return new Lineinput(options);
    }

    options = options || {};

    options.scrollable = false;

    Textarea.call(this, options);

    this.secret = options.secret;
    this.censor = options.censor;
    this._xCursor = 0;
    this.history = [];
    this._iHistory = 0;
}

Lineinput.prototype.__proto__ = Textarea.prototype;

Lineinput.prototype.type = 'lineinput';

Lineinput.prototype.__olistener = Lineinput.prototype._listener;
Lineinput.prototype._listener = function(ch, key) {
    if (key.name === 'enter') {
        this._done(null, this.value);
        return;
    }
    return this.__olistener(ch, key);
};

Lineinput.prototype.pushHistory = function (sText) {
    const bEmpty = this.history.length === 0
    const prev = bEmpty ? '' : this.history[this.history.length - 1]
    if (bEmpty || (prev !== '' && prev !== sText)) {
        this.history.push(sText)
    }
    this._iHistory = 0
}

Lineinput.prototype.getHistory = function () {
    const hl = this.history.length
    if (hl === 0) {
        return null
    }
    if (this._iHistory === 0) {
        return ''
    }
    const h = Math.max(0, Math.min(hl, this._iHistory))
    return this.history[hl - h]
}

Lineinput.prototype.setValue = function(value) {
    var visible, val;
    if (value == null) {
        value = this.value;
    }
    if (this._value !== value) {
        value = value.replace(/\n/g, '');
        this.value = value;
        this._value = value;
        if (this.secret) {
            this.setContent('');
        } else if (this.censor) {
            this.setContent(Array(this.value.length + 1).join('*'));
        } else {
            visible = -(this.width - this.iwidth - 1);
            val = this.value.replace(/\t/g, this.screen.tabc);
            this.setContent(val.slice(visible));
        }
        this._updateCursor();
    }
};

Lineinput.prototype._updateCursor = function(get) {
    if (this.screen.focused !== this) {
        return;
    }

    var lpos = get ? this.lpos : this._getCoords();
    if (!lpos) return;

    var last = this._clines[this._clines.length - 1]
        , program = this.screen.program
        , line
        , cx
        , cy;

    // Stop a situation where the textarea begins scrolling
    // and the last cline appears to always be empty from the
    // _typeScroll `+ '\n'` thing.
    // Maybe not necessary anymore?
    if (last === '' && this.value[this.value.length - 1] !== '\n') {
        last = this._clines[this._clines.length - 2] || '';
    }

    line = Math.min(
        this._clines.length - 1 - (this.childBase || 0),
        (lpos.yl - lpos.yi) - this.iheight - 1);

    // When calling clearValue() on a full textarea with a border, the first
    // argument in the above Math.min call ends up being -2. Make sure we stay
    // positive.
    line = Math.max(0, line);

    cy = lpos.yi + this.itop + line;
    const nLineLength = this.strWidth(last)
    this._xCursor = Math.max(0, Math.min(nLineLength, this._xCursor))
    cx = lpos.xi + this.ileft + nLineLength - this._xCursor;

    // XXX Not sure, but this may still sometimes
    // cause problems when leaving editor.
    if (cy === program.y && cx === program.x) {
        return;
    }

    if (cy === program.y) {
        if (cx > program.x) {
            program.cuf(cx - program.x);
        } else if (cx < program.x) {
            program.cub(program.x - cx);
        }
    } else if (cx === program.x) {
        if (cy > program.y) {
            program.cud(cy - program.y);
        } else if (cy < program.y) {
            program.cuu(program.y - cy);
        }
    } else {
        program.cup(cy, cx);
    }
};

function strRemove(str, i, n) {
    const astr = str.split('')
    astr.splice(i, n)
    return astr.join('')
}

function strInsert(str, i, ch) {
    const astr = str.split('')
    astr.splice(i, 0, ch)
    return astr.join('')
}

Lineinput.prototype._listener = function(ch, key) {
    var done = this._done
        , value = this.value;

    if (key.name === 'return') return;
    if (key.name === 'enter') {
        ch = '\n';
    }

    let bForceRender = false
    let gh
    switch (key.name) {
        case 'left':
            ++this._xCursor
            bForceRender = true
            break;

        case 'right':
            --this._xCursor
            bForceRender = true
            break;

        case 'up':
            this._iHistory = Math.max(0, Math.min(this._iHistory + 1, this.history.length))
            gh = this.getHistory()
            if (gh !== null) {
                this.value = this.getHistory()
                this._xCursor = 0
            }
            break;

        case 'down':
            this._iHistory = Math.max(0, Math.min(this._iHistory - 1, this.history.length))
            gh = this.getHistory()
            if (gh !== null) {
                this.value = this.getHistory()
                this._xCursor = 0
            }
            break;

        case 'home':
            this._xCursor = this.value.length
            bForceRender = true
            break

        case 'end':
            this._xCursor = 0
            bForceRender = true
            break

        case 'delete':
            this.value = strRemove(this.value, this.value.length - this._xCursor, 1);
            --this._xCursor
            break

        case 'escape':
            done(null, null)
            break

        case 'backspace':
            this.value = strRemove(this.value, this.value.length - this._xCursor - 1, 1);
            break

        default:
            if (!/^[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]$/.test(ch)) {
                this.value = strInsert(this.value, this.value.length - this._xCursor, ch);
            }
            break
    }

    if (this.options.keys && key.ctrl && key.name === 'e') {
        return this.readEditor();
    }

    if (this.value !== value || bForceRender) {
        this.screen.render();
    }
};

Lineinput.prototype.submit = function() {
    if (!this.__listener) return;
    return this.__listener('\r', { name: 'enter' });
};

/**
 * Expose
 */

blessed.widget.lineinput = Lineinput
blessed.helpers.merge(blessed, Lineinput)

module.exports = Lineinput;

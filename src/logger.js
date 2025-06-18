"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = log;
const dayjs_1 = __importDefault(require("dayjs"));
const vscode_1 = require("vscode");
const outputChannel = vscode_1.window.createOutputChannel('Discord Presence');
function send(level, message) {
    outputChannel.appendLine(`[${(0, dayjs_1.default)().format('DD/MM/YYYY HH:mm:ss')} - ${level}] ${message}`);
}
function log(level, message) {
    if (typeof message === 'string') {
        send(level, message);
    }
    else if (message instanceof Error) {
        send(level, message.message);
        if (message.stack) {
            send(level, message.stack);
        }
    }
    else if (typeof message === 'object') {
        try {
            const json = JSON.stringify(message, null, 2);
            send(level, json);
        }
        catch (_a) { }
    }
}

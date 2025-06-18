"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanUp = cleanUp;
exports.activate = activate;
exports.deactivate = deactivate;
const discord_rpc_1 = require("@xhayper/discord-rpc");
const throttle_1 = __importDefault(require("lodash-es/throttle"));
const vscode_1 = require("vscode");
const activity_1 = require("./activity");
const constants_1 = require("./constants");
const logger_1 = require("./logger");
const util_1 = require("./util");
const statusBarIcon = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Left);
statusBarIcon.text = '$(pulse) Connecting to Discord...';
let rpc = new discord_rpc_1.Client({ transport: { type: 'ipc' }, clientId: constants_1.CLIENT_ID });
const config = (0, util_1.getConfig)();
let state = {};
let idle;
let listeners = [];
function cleanUp() {
    for (const listener of listeners)
        listener.dispose();
    listeners = [];
}
function sendActivity() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        // eslint-disable-next-line require-atomic-updates
        state = Object.assign({}, (yield (0, activity_1.activity)(state)));
        void ((_a = rpc.user) === null || _a === void 0 ? void 0 : _a.setActivity(state));
    });
}
function login() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        (0, logger_1.log)("INFO" /* LogLevel.Info */, 'Creating discord-rpc client');
        rpc = new discord_rpc_1.Client({ transport: { type: 'ipc' }, clientId: constants_1.CLIENT_ID });
        rpc.on('ready', () => {
            (0, logger_1.log)("INFO" /* LogLevel.Info */, 'Successfully connected to Discord');
            cleanUp();
            statusBarIcon.text = '$(globe) Connected to Discord';
            statusBarIcon.tooltip = 'Connected to Discord';
            void sendActivity();
            const onChangeActiveTextEditor = vscode_1.window.onDidChangeActiveTextEditor(() => __awaiter(this, void 0, void 0, function* () { return sendActivity(); }));
            const onChangeTextDocument = vscode_1.workspace.onDidChangeTextDocument((0, throttle_1.default)(() => __awaiter(this, void 0, void 0, function* () { return sendActivity(); }), 2000));
            const onStartDebugSession = vscode_1.debug.onDidStartDebugSession(() => __awaiter(this, void 0, void 0, function* () { return sendActivity(); }));
            const onTerminateDebugSession = vscode_1.debug.onDidTerminateDebugSession(() => __awaiter(this, void 0, void 0, function* () { return sendActivity(); }));
            listeners.push(onChangeActiveTextEditor, onChangeTextDocument, onStartDebugSession, onTerminateDebugSession);
        });
        rpc.on('disconnected', () => {
            cleanUp();
            void rpc.destroy();
            statusBarIcon.text = '$(pulse) Reconnect to Discord';
            statusBarIcon.command = 'discord.reconnect';
        });
        try {
            yield rpc.login();
        }
        catch (error) {
            (0, logger_1.log)("ERROR" /* LogLevel.Error */, `Encountered following error while trying to login:\n${error}`);
            cleanUp();
            void rpc.destroy();
            if (!config["suppressNotifications" /* CONFIG_KEYS.SuppressNotifications */]) {
                // @ts-expect-error: error is not typed
                if ((_a = error === null || error === void 0 ? void 0 : error.message) === null || _a === void 0 ? void 0 : _a.includes('ENOENT'))
                    void vscode_1.window.showErrorMessage('No Discord client detected');
                else
                    void vscode_1.window.showErrorMessage(`Couldn't connect to Discord via RPC: ${error}`);
            }
            statusBarIcon.text = '$(pulse) Reconnect to Discord';
            statusBarIcon.command = 'discord.reconnect';
        }
    });
}
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, logger_1.log)("INFO" /* LogLevel.Info */, 'Discord Presence activated');
        let isWorkspaceExcluded = false;
        for (const pattern of config["workspaceExcludePatterns" /* CONFIG_KEYS.WorkspaceExcludePatterns */]) {
            const regex = new RegExp(pattern);
            const folders = vscode_1.workspace.workspaceFolders;
            if (!folders)
                break;
            if (folders.some((folder) => regex.test(folder.uri.fsPath))) {
                isWorkspaceExcluded = true;
                break;
            }
        }
        const enable = (...args_1) => __awaiter(this, [...args_1], void 0, function* (update = true) {
            if (update) {
                try {
                    yield config.update('enabled', true);
                }
                catch (_a) { }
            }
            (0, logger_1.log)("INFO" /* LogLevel.Info */, 'Enable: Cleaning up old listeners');
            cleanUp();
            statusBarIcon.text = '$(pulse) Connecting to Discord...';
            statusBarIcon.show();
            (0, logger_1.log)("INFO" /* LogLevel.Info */, 'Enable: Attempting to recreate login');
            void login();
        });
        const disable = (...args_1) => __awaiter(this, [...args_1], void 0, function* (update = true) {
            if (update) {
                try {
                    yield config.update('enabled', false);
                }
                catch (_a) { }
            }
            (0, logger_1.log)("INFO" /* LogLevel.Info */, 'Disable: Cleaning up old listeners');
            cleanUp();
            void (rpc === null || rpc === void 0 ? void 0 : rpc.destroy());
            (0, logger_1.log)("INFO" /* LogLevel.Info */, 'Disable: Destroyed the rpc instance');
            statusBarIcon.hide();
        });
        const enabler = vscode_1.commands.registerCommand('discord.enable', () => __awaiter(this, void 0, void 0, function* () {
            yield disable();
            yield enable();
            yield vscode_1.window.showInformationMessage('Enabled Discord Presence for this workspace');
        }));
        const disabler = vscode_1.commands.registerCommand('discord.disable', () => __awaiter(this, void 0, void 0, function* () {
            yield disable();
            yield vscode_1.window.showInformationMessage('Disabled Discord Presence for this workspace');
        }));
        const reconnecter = vscode_1.commands.registerCommand('discord.reconnect', () => __awaiter(this, void 0, void 0, function* () {
            yield disable(false);
            yield enable(false);
        }));
        const disconnect = vscode_1.commands.registerCommand('discord.disconnect', () => __awaiter(this, void 0, void 0, function* () {
            yield disable(false);
            statusBarIcon.text = '$(pulse) Reconnect to Discord';
            statusBarIcon.command = 'discord.reconnect';
            statusBarIcon.show();
        }));
        context.subscriptions.push(enabler, disabler, reconnecter, disconnect);
        if (!isWorkspaceExcluded && config["enabled" /* CONFIG_KEYS.Enabled */]) {
            statusBarIcon.show();
            yield login();
        }
        vscode_1.window.onDidChangeWindowState((windowState) => __awaiter(this, void 0, void 0, function* () {
            if (config["idleTimeout" /* CONFIG_KEYS.IdleTimeout */] !== 0) {
                if (windowState.focused) {
                    if (idle) {
                        // eslint-disable-next-line no-restricted-globals
                        clearTimeout(idle);
                    }
                    yield sendActivity();
                }
                else {
                    // eslint-disable-next-line no-restricted-globals
                    idle = setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                        var _a;
                        state = {};
                        yield ((_a = rpc.user) === null || _a === void 0 ? void 0 : _a.clearActivity());
                    }), config["idleTimeout" /* CONFIG_KEYS.IdleTimeout */] * 1000);
                }
            }
        }));
        yield (0, util_1.getGit)();
    });
}
function deactivate() {
    cleanUp();
    void rpc.destroy();
}

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
Object.defineProperty(exports, "__esModule", { value: true });
exports.toTitle = exports.toUpper = exports.toLower = void 0;
exports.getConfig = getConfig;
exports.resolveFileIcon = resolveFileIcon;
exports.getGit = getGit;
const node_path_1 = require("node:path");
const vscode_1 = require("vscode");
const constants_1 = require("./constants");
const logger_1 = require("./logger");
let git;
function getConfig() {
    return vscode_1.workspace.getConfiguration('discord');
}
const toLower = (str) => str.toLocaleLowerCase();
exports.toLower = toLower;
const toUpper = (str) => str.toLocaleUpperCase();
exports.toUpper = toUpper;
const toTitle = (str) => (0, exports.toLower)(str).replace(/^\w/, (char) => (0, exports.toUpper)(char));
exports.toTitle = toTitle;
function resolveFileIcon(document) {
    var _a;
    const filename = (0, node_path_1.basename)(document.fileName);
    const findKnownExtension = Object.keys(constants_1.KNOWN_EXTENSIONS).find((key) => {
        if (filename.endsWith(key)) {
            return true;
        }
        const match = /^\/(.*)\/([gimy]+)$/.exec(key);
        if (!match) {
            return false;
        }
        const regex = new RegExp(match[1], match[2]);
        return regex.test(filename);
    });
    const findKnownLanguage = constants_1.KNOWN_LANGUAGES.find((key) => key.language === document.languageId);
    const fileIcon = findKnownExtension
        ? constants_1.KNOWN_EXTENSIONS[findKnownExtension]
        : findKnownLanguage
            ? findKnownLanguage.image
            : null;
    return typeof fileIcon === 'string' ? fileIcon : ((_a = fileIcon === null || fileIcon === void 0 ? void 0 : fileIcon.image) !== null && _a !== void 0 ? _a : 'text');
}
function getGit() {
    return __awaiter(this, void 0, void 0, function* () {
        if (git || git === null) {
            return git;
        }
        try {
            (0, logger_1.log)("DEBUG" /* LogLevel.Debug */, 'Loading git extension');
            const gitExtension = vscode_1.extensions.getExtension('vscode.git');
            if (!(gitExtension === null || gitExtension === void 0 ? void 0 : gitExtension.isActive)) {
                (0, logger_1.log)("TRACE" /* LogLevel.Trace */, 'Git extension not activated, activating...');
                yield (gitExtension === null || gitExtension === void 0 ? void 0 : gitExtension.activate());
            }
            // eslint-disable-next-line require-atomic-updates
            git = gitExtension === null || gitExtension === void 0 ? void 0 : gitExtension.exports.getAPI(1);
        }
        catch (error) {
            // eslint-disable-next-line require-atomic-updates
            git = null;
            (0, logger_1.log)("ERROR" /* LogLevel.Error */, `Failed to load git extension, is git installed?; ${error}`);
        }
        return git;
    });
}

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
exports.activity = activity;
const node_path_1 = require("node:path");
const vscode_1 = require("vscode");
const constants_1 = require("./constants");
const logger_1 = require("./logger");
const util_1 = require("./util");
function fileDetails(_raw, document, selection) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        let raw = _raw.slice();
        if (raw.includes("{total_lines}" /* REPLACE_KEYS.TotalLines */)) {
            raw = raw.replace("{total_lines}" /* REPLACE_KEYS.TotalLines */, document.lineCount.toLocaleString());
        }
        if (raw.includes("{current_line}" /* REPLACE_KEYS.CurrentLine */)) {
            raw = raw.replace("{current_line}" /* REPLACE_KEYS.CurrentLine */, (selection.active.line + 1).toLocaleString());
        }
        if (raw.includes("{current_column}" /* REPLACE_KEYS.CurrentColumn */)) {
            raw = raw.replace("{current_column}" /* REPLACE_KEYS.CurrentColumn */, (selection.active.character + 1).toLocaleString());
        }
        if (raw.includes("{file_size}" /* REPLACE_KEYS.FileSize */)) {
            let currentDivision = 0;
            let size;
            try {
                ({ size } = yield vscode_1.workspace.fs.stat(document.uri));
            }
            catch (_k) {
                size = document.getText().length;
            }
            const originalSize = size;
            if (originalSize > 1000) {
                size /= 1000;
                currentDivision++;
                while (size > 1000) {
                    currentDivision++;
                    size /= 1000;
                }
            }
            raw = raw.replace("{file_size}" /* REPLACE_KEYS.FileSize */, `${originalSize > 1000 ? size.toFixed(2) : size}${constants_1.FILE_SIZES[currentDivision]}`);
        }
        const git = yield (0, util_1.getGit)();
        if (raw.includes("{git_branch}" /* REPLACE_KEYS.GitBranch */)) {
            if (git === null || git === void 0 ? void 0 : git.repositories.length) {
                raw = raw.replace("{git_branch}" /* REPLACE_KEYS.GitBranch */, (_c = (_b = (_a = git.repositories.find((repo) => repo.ui.selected)) === null || _a === void 0 ? void 0 : _a.state.HEAD) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : constants_1.FAKE_EMPTY);
            }
            else {
                raw = raw.replace("{git_branch}" /* REPLACE_KEYS.GitBranch */, constants_1.UNKNOWN_GIT_BRANCH);
            }
        }
        if (raw.includes("{git_repo_name}" /* REPLACE_KEYS.GitRepoName */)) {
            if (git === null || git === void 0 ? void 0 : git.repositories.length) {
                raw = raw.replace("{git_repo_name}" /* REPLACE_KEYS.GitRepoName */, (_j = (_h = (_g = (_f = (_e = (_d = git.repositories) === null || _d === void 0 ? void 0 : _d.find((repo) => repo.ui.selected)) === null || _e === void 0 ? void 0 : _e.state.remotes[0]) === null || _f === void 0 ? void 0 : _f.fetchUrl) === null || _g === void 0 ? void 0 : _g.split('/')[1]) === null || _h === void 0 ? void 0 : _h.replace('.git', '')) !== null && _j !== void 0 ? _j : constants_1.FAKE_EMPTY);
            }
            else {
                raw = raw.replace("{git_repo_name}" /* REPLACE_KEYS.GitRepoName */, constants_1.UNKNOWN_GIT_REPO_NAME);
            }
        }
        return raw;
    });
}
function details(idling, editing, debugging) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const config = (0, util_1.getConfig)();
        let raw = config[idling].replace("{empty}" /* REPLACE_KEYS.Empty */, constants_1.FAKE_EMPTY);
        if (vscode_1.window.activeTextEditor) {
            const fileName = (0, node_path_1.basename)(vscode_1.window.activeTextEditor.document.fileName);
            const { dir } = (0, node_path_1.parse)(vscode_1.window.activeTextEditor.document.fileName);
            const split = dir.split(node_path_1.sep);
            const dirName = split[split.length - 1];
            const noWorkspaceFound = config["lowerDetailsNoWorkspaceFound" /* CONFIG_KEYS.LowerDetailsNoWorkspaceFound */].replace("{empty}" /* REPLACE_KEYS.Empty */, constants_1.FAKE_EMPTY);
            const workspaceFolder = vscode_1.workspace.getWorkspaceFolder(vscode_1.window.activeTextEditor.document.uri);
            const workspaceFolderName = (_a = workspaceFolder === null || workspaceFolder === void 0 ? void 0 : workspaceFolder.name) !== null && _a !== void 0 ? _a : noWorkspaceFound;
            const workspaceName = (_c = (_b = vscode_1.workspace.name) === null || _b === void 0 ? void 0 : _b.replace("(Workspace)" /* REPLACE_KEYS.VSCodeWorkspace */, constants_1.EMPTY)) !== null && _c !== void 0 ? _c : workspaceFolderName;
            const workspaceAndFolder = `${workspaceName}${workspaceFolderName === constants_1.FAKE_EMPTY ? '' : ` - ${workspaceFolderName}`}`;
            const fileIcon = (0, util_1.resolveFileIcon)(vscode_1.window.activeTextEditor.document);
            if (vscode_1.debug.activeDebugSession) {
                raw = config[debugging];
            }
            else {
                raw = config[editing];
            }
            if (workspaceFolder) {
                const { name } = workspaceFolder;
                const relativePath = vscode_1.workspace.asRelativePath(vscode_1.window.activeTextEditor.document.fileName).split(node_path_1.sep);
                relativePath.splice(-1, 1);
                raw = raw.replace("{full_dir_name}" /* REPLACE_KEYS.FullDirName */, `${name}${node_path_1.sep}${relativePath.join(node_path_1.sep)}`);
            }
            try {
                raw = yield fileDetails(raw, vscode_1.window.activeTextEditor.document, vscode_1.window.activeTextEditor.selection);
            }
            catch (error) {
                (0, logger_1.log)("ERROR" /* LogLevel.Error */, `Failed to generate file details: ${error}`);
            }
            raw = raw
                .replace("{file_name}" /* REPLACE_KEYS.FileName */, fileName)
                .replace("{dir_name}" /* REPLACE_KEYS.DirName */, dirName)
                .replace("{workspace}" /* REPLACE_KEYS.Workspace */, workspaceName)
                .replace("{workspace_folder}" /* REPLACE_KEYS.WorkspaceFolder */, workspaceFolderName)
                .replace("{workspace_and_folder}" /* REPLACE_KEYS.WorkspaceAndFolder */, workspaceAndFolder)
                .replace("{lang}" /* REPLACE_KEYS.LanguageLowerCase */, (0, util_1.toLower)(fileIcon))
                .replace("{Lang}" /* REPLACE_KEYS.LanguageTitleCase */, (0, util_1.toTitle)(fileIcon))
                .replace("{LANG}" /* REPLACE_KEYS.LanguageUpperCase */, (0, util_1.toUpper)(fileIcon));
        }
        return raw;
    });
}
function activity() {
    return __awaiter(this, arguments, void 0, function* (previous = {}) {
        var _a, _b, _c;
        const config = (0, util_1.getConfig)();
        const swapBigAndSmallImage = config["swapBigAndSmallImage" /* CONFIG_KEYS.SwapBigAndSmallImage */];
        const appName = vscode_1.env.appName;
        const defaultSmallImageKey = vscode_1.debug.activeDebugSession
            ? constants_1.DEBUG_IMAGE_KEY
            : appName.includes('Cursor')
                ? constants_1.CURSOR_IMAGE_KEY
                : appName.includes('Insiders')
                    ? constants_1.VSCODE_INSIDERS_IMAGE_KEY
                    : constants_1.VSCODE_IMAGE_KEY;
        const defaultSmallImageText = config["smallImage" /* CONFIG_KEYS.SmallImage */].replace("{app_name}" /* REPLACE_KEYS.AppName */, appName);
        const defaultLargeImageText = config["largeImageIdling" /* CONFIG_KEYS.LargeImageIdling */];
        const removeDetails = config["removeDetails" /* CONFIG_KEYS.RemoveDetails */];
        const removeLowerDetails = config["removeLowerDetails" /* CONFIG_KEYS.RemoveLowerDetails */];
        const removeRemoteRepository = config["removeRemoteRepository" /* CONFIG_KEYS.RemoveRemoteRepository */];
        const git = yield (0, util_1.getGit)();
        let state = {
            type: 0,
            details: removeDetails
                ? undefined
                : yield details("detailsIdling" /* CONFIG_KEYS.DetailsIdling */, "detailsEditing" /* CONFIG_KEYS.DetailsEditing */, "detailsDebugging" /* CONFIG_KEYS.DetailsDebugging */),
            startTimestamp: config["removeTimestamp" /* CONFIG_KEYS.RemoveTimestamp */] ? undefined : ((_a = previous.startTimestamp) !== null && _a !== void 0 ? _a : Date.now()),
            largeImageKey: constants_1.IDLE_IMAGE_KEY,
            largeImageText: defaultLargeImageText,
            smallImageKey: defaultSmallImageKey,
            smallImageText: defaultSmallImageText,
        };
        if (swapBigAndSmallImage) {
            state = Object.assign(Object.assign({}, state), { largeImageKey: defaultSmallImageKey, largeImageText: defaultSmallImageText, smallImageKey: constants_1.IDLE_IMAGE_KEY, smallImageText: defaultLargeImageText });
        }
        if (!removeRemoteRepository && (git === null || git === void 0 ? void 0 : git.repositories.length)) {
            let repo = (_c = (_b = git.repositories.find((repo) => repo.ui.selected)) === null || _b === void 0 ? void 0 : _b.state.remotes[0]) === null || _c === void 0 ? void 0 : _c.fetchUrl;
            if (repo) {
                if (repo.startsWith('git@') || repo.startsWith('ssh://')) {
                    repo = repo.replace('ssh://', '').replace(':', '/').replace('git@', 'https://').replace('.git', '');
                }
                else {
                    repo = repo.replace(/(https:\/\/)([^@]*)@(.*?$)/, '$1$3').replace('.git', '');
                }
                state = Object.assign(Object.assign({}, state), { buttons: [{ label: 'View Repository', url: repo }] });
            }
        }
        if (vscode_1.window.activeTextEditor) {
            const largeImageKey = (0, util_1.resolveFileIcon)(vscode_1.window.activeTextEditor.document);
            const largeImageText = config["largeImage" /* CONFIG_KEYS.LargeImage */]
                .replace("{lang}" /* REPLACE_KEYS.LanguageLowerCase */, (0, util_1.toLower)(largeImageKey))
                .replace("{Lang}" /* REPLACE_KEYS.LanguageTitleCase */, (0, util_1.toTitle)(largeImageKey))
                .replace("{LANG}" /* REPLACE_KEYS.LanguageUpperCase */, (0, util_1.toUpper)(largeImageKey))
                .padEnd(2, constants_1.FAKE_EMPTY);
            state = Object.assign(Object.assign({}, state), { details: removeDetails
                    ? undefined
                    : yield details("detailsIdling" /* CONFIG_KEYS.DetailsIdling */, "detailsEditing" /* CONFIG_KEYS.DetailsEditing */, "detailsDebugging" /* CONFIG_KEYS.DetailsDebugging */), state: removeLowerDetails
                    ? undefined
                    : yield details("lowerDetailsIdling" /* CONFIG_KEYS.LowerDetailsIdling */, "lowerDetailsEditing" /* CONFIG_KEYS.LowerDetailsEditing */, "lowerDetailsDebugging" /* CONFIG_KEYS.LowerDetailsDebugging */) });
            if (swapBigAndSmallImage) {
                state = Object.assign(Object.assign({}, state), { smallImageKey: largeImageKey, smallImageText: largeImageText });
            }
            else {
                state = Object.assign(Object.assign({}, state), { largeImageKey,
                    largeImageText });
            }
            (0, logger_1.log)("TRACE" /* LogLevel.Trace */, `VSCode language id: ${vscode_1.window.activeTextEditor.document.languageId}`);
        }
        return state;
    });
}

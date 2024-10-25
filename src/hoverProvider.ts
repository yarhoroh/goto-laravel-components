import { existsSync } from "fs";
import {
    HoverProvider as BaseHoverProvider,
    Hover,
    MarkdownString,
    Position,
    TextDocument,
    Uri,
    workspace,
    ProviderResult,
} from "vscode";
import { nameToIndexPath, nameToPath, nameToViewPath } from "./utils";

export default class HoverProvider implements BaseHoverProvider {
    public provideHover(
        doc: TextDocument,
        position: Position
    ): ProviderResult<Hover> {
        const config = workspace.getConfiguration("yar_laravel_goto_components");
        const regex = new RegExp(config.regex);
        const custom_path = config.custom_path;
        const range = doc.getWordRangeAtPosition(position, regex);

        if (!range) {
            return;
        }

        const componentName = doc.getText(range).replace('>', '');
        const workspacePath = workspace.getWorkspaceFolder(doc.uri)?.uri.fsPath;
        let componentPath = nameToPath(componentName, custom_path);

        if (!existsSync(workspacePath + componentPath)) {
            let newComponentPath = nameToIndexPath(componentName, custom_path);

            if (existsSync(workspacePath + newComponentPath)) {
                componentPath = newComponentPath;
            }

            if (!existsSync(workspacePath + componentPath)) {
                newComponentPath = nameToViewPath(componentName, workspacePath, custom_path);

                if (existsSync(workspacePath + newComponentPath)) {
                    componentPath = newComponentPath;
                }
            }
        }

        const lookUpUri = `[${componentPath}](${Uri.file(
            workspacePath + componentPath
        )})`;

        if (!existsSync(workspacePath + componentPath)) {
            return new Hover(new MarkdownString(`*${componentName}*: (Not Found) ${lookUpUri}`));
        }

        return new Hover(new MarkdownString(`*${componentName}*: ${lookUpUri}`));
    }
}

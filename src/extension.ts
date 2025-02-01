import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  console.log('"deepseek-ext" is now active!');

  const disposable = vscode.commands.registerCommand(
    "deepseek-ext.hello",
    () => {
      vscode.window.showInformationMessage("hi");
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}

import * as vscode from "vscode";
import ollama from "ollama";

export function activate(context: vscode.ExtensionContext) {
  console.log('"deepseek-ext" is now active!');

  const disposable = vscode.commands.registerCommand(
    "deepseek-ext.start",
    () => {
      const panel = vscode.window.createWebviewPanel(
        "deeptalk",
        "DeepTalk",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      );

      panel.webview.html = getWebViewContent();
      panel.webview.onDidReceiveMessage(async (message: any) => {
        if (message.command === "chat") {
          const userPrompt = message.question;
          let responseText = "";

          try {
            const streamResponse = await ollama.chat({
              model: "deepseek-r1:latest",
              messages: [{ role: "user", content: userPrompt }],
              stream: true,
            });

            for await (const part of streamResponse) {
              responseText += part.message.content;
              panel.webview.postMessage({
                command: "chatResponse",
                text: responseText,
              });
            }
          } catch (error) {
            panel.webview.postMessage({
              command: "chatResponse",
              text: `Error: ${String(error)}`,
            });
          }
        }
      });
    }
  );

  context.subscriptions.push(disposable);
}

function getWebViewContent(): string {
  return /*html*/ `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <style>
      body {
        font-family: sans-serif;
        margin: 1rem;
      }
      #prompt { width: 100%; box-sizing: border-box; }
      #response { border: 1px solid #ccc; padding: 0.5rem; margin-top: 1rem; }
    </style>
  </head>
  <body>
    <h2>DeepSeek VS Code Extension</h2>
    <textarea id="prompt" rows="3" placeholder="Ask me something..."></textarea><br />
    <button id="askBtn">Ask</button>
    <div id="response"></div>

    <script>
      const vscode = acquireVsCodeApi();

      const prompt = document.getElementById('prompt');
      const askBtn = document.getElementById('askBtn');
      const response = document.getElementById('response');

      askBtn.addEventListener('click', () => {
        const question = prompt.value;
        prompt.value = '';
        response.innerHTML = 'Thinking...';

        vscode.postMessage({ command: 'chat', question });
      });

      window.addEventListener('message', event => {
        const {command, text} = event.data;
        if (command === 'chatResponse') {
          document.getElementById('response').innerHTML = text;
        }
      });
      </script>
  </body>
  </html>`;
}

export function deactivate() {}

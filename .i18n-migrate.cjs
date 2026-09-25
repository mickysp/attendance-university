const fs = require('fs');
const ts = require('typescript');
const thai = /[\u0e00-\u0e7f]/;
const files = [];
function walk(dir) {
  for (const item of fs.readdirSync(dir, {withFileTypes:true})) {
    const path = dir+'/'+item.name;
    if(item.isDirectory()) walk(path);
    else if(path.endsWith('.tsx')) files.push(path);
  }
}
walk('src/app'); walk('src/components');
const displayAttributes = new Set(['title','label','placeholder','aria-label','ariaLabel','alt','description','inputLabel','emptyLabel','searchPlaceholder']);
const displayProperties = /\.(?:label|title|text|suffix|description|status|unit)$/;
const displayVariables = /^(?:error|errorMessage|message|successMessage|actionError|label|title|description|statusText|duplicateError|nameError|emailError|usernameError|formError|uploadError)$/;
const templates = {};
for (const path of files) {
  if (/LanguageSwitcher|Sidebar/.test(path)) continue;
  let source = fs.readFileSync(path,'utf8');
  const ast = ts.createSourceFile(path, source, 99, true, ts.ScriptKind.TSX);
  const edits = [];
  const add = (node,text) => edits.push({start:node.getStart(ast),end:node.end,text});
  const wrap = (node) => add(node,`tr(${node.getText(ast)})`);
  function expression(node) {
    if (!node) return;
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (thai.test(node.text)) wrap(node);
    } else if (ts.isTemplateExpression(node)) {
      let key=node.head.text;
      node.templateSpans.forEach((span,i)=>key+=`{${i}}`+span.literal.text);
      if(thai.test(key)) {
        templates[key]=true;
        add(node,`tr(${JSON.stringify(key)}, {${node.templateSpans.map((span,i)=>`${JSON.stringify(i)}: ${span.expression.getText(ast)}`).join(',')}})`);
      }
    } else if(ts.isConditionalExpression(node)) {
      expression(node.whenTrue);expression(node.whenFalse);
    } else if(ts.isBinaryExpression(node)) {
      if([ts.SyntaxKind.BarBarToken,ts.SyntaxKind.QuestionQuestionToken].includes(node.operatorToken.kind)) {
        expression(node.left);expression(node.right);
      } else if(node.operatorToken.kind===ts.SyntaxKind.AmpersandAmpersandToken) expression(node.right);
    } else if(ts.isParenthesizedExpression(node)) expression(node.expression);
    else if(displayVariables.test(node.getText(ast)) || displayProperties.test(node.getText(ast)) || /^duplicateMessage\(/.test(node.getText(ast))) wrap(node);
  }
  function visit(node) {
    if (ts.isJsxText(node) && thai.test(node.text)) {
      const text=node.text.replace(/\s+/g,' ').trim();
      edits.push({start:node.pos,end:node.end,text:`{tr(${JSON.stringify(text)})}`});
      return;
    }
    if(ts.isJsxAttribute(node)) {
      if(displayAttributes.has(node.name.getText(ast)) && node.initializer) {
        if(ts.isStringLiteral(node.initializer) && thai.test(node.initializer.text)) add(node.initializer,`{tr(${JSON.stringify(node.initializer.text)})}`);
        else if(ts.isJsxExpression(node.initializer)) expression(node.initializer.expression);
      }
      // Do not translate values, keys, styling, callbacks or persisted data.
      return;
    }
    if(ts.isJsxExpression(node)) expression(node.expression);
    if(ts.isStringLiteral(node) && node.text==='th-TH') add(node,'getLocale()');
    ts.forEachChild(node,visit);
  }
  visit(ast);
  if(!edits.length) continue;
  function addSubscription(node) {
    if(ts.isFunctionDeclaration(node) && node.name && /^[A-Z]/.test(node.name.text) && node.body) {
      const text=node.body.getText(ast);
      if(text.includes('<') && !text.includes('useLanguage(')) edits.push({start:node.body.getStart(ast)+1,end:node.body.getStart(ast)+1,text:'\n  useLanguage();\n'});
    }
    ts.forEachChild(node,addSubscription);
  }
  addSubscription(ast);
  const languageImport=ast.statements.find(n=>ts.isImportDeclaration(n)&&n.moduleSpecifier.text==='@/lib/language');
  const needsLocale=edits.some(e=>e.text==='getLocale()');
  const existing=languageImport?.importClause?.namedBindings?.elements?.map(e=>e.name.text)??[];
  const imports=['translate as tr',...(!existing.includes('useLanguage')?['useLanguage']:[]),...(needsLocale?['getLocale']:[])];
  const directive=ast.statements[0];
  const isClient=ts.isExpressionStatement(directive)&&ts.isStringLiteral(directive.expression)&&directive.expression.text==='use client';
  const at=isClient?directive.end:0;
  edits.push({start:at,end:at,text:`${isClient?'\n':'"use client";\n'}import { ${imports.join(', ')} } from "@/lib/language";\n`});
  // Avoid replacing expressions twice when traversal reaches their children.
  const unique=edits.filter((e,i)=>!edits.some((p,j)=>j!==i&&p.start<=e.start&&p.end>=e.end&&(p.start<e.start||p.end>e.end)));
  unique.sort((a,b)=>b.start-a.start);
  for(const edit of unique) source=source.slice(0,edit.start)+edit.text+source.slice(edit.end);
  fs.writeFileSync(path,source);
}
fs.writeFileSync('.i18n-used-templates.json',JSON.stringify(Object.keys(templates),null,2));

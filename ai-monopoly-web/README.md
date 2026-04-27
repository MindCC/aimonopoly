# AI 创业大富翁网页应用

## 打开方式

直接用浏览器打开：

`D:\workspace\aimonopoly\ai-monopoly-web\index.html`

这是一个纯静态网页，不需要安装依赖，也不需要启动服务器。

## 已实现功能

- 多班级切换：左侧班级列表可新增班级。
- 小组管理：每个班级有独立小组，小组数据互不影响。
- 角色管理：每组可设置 CEO / CTO / CMO / CFO。
- 资源面板：现金、用户、产品力、技术力、声誉、合规即时更新。
- 课堂经营：内置运营策略库，支持成功、部分成功、失败三种判定。
- 班级榜单：按综合估值展示班级内小组排名。
- 期末棋盘：支持 24 格棋盘、掷骰子、落点任务和教师指定落点。
- 手动调整：可按教师判断自由增减各项资源。
- 期末卡牌：支持 16 张机会卡、16 张危机卡、12 张道具卡，支持条件结算、成功/失败结算、购买和使用道具卡。
- 期末评分：按 100 分制录入并自动汇总。
- 经营记录：所有策略、抽卡、调整都会写入本组记录。
- 撤销功能：可撤销当前小组上一条经营记录；组间互动会按同一个 transactionId 同步撤销双方变化。
- 数据导入导出：可导出带 schemaVersion 的 JSON 备份，也可导入继续使用。

## 项目结构

```text
ai-monopoly-web/
  index.html
  styles.css
  app.js
  src/
    rules.js        # 策略、棋盘、卡牌、评分项等规则数据
    game-logic.js   # 输入转义、指标归一化、道具效果、事务撤销
    events.js       # 经营记录/事件创建
    storage.js      # localStorage、schemaVersion、导入导出
  tests/
    *.test.js       # Node.js 内置 test runner 测试
```

后续如果升级到 Node.js / SQLite，优先替换 `src/storage.js`，让 `saveState/loadState/exportState` 改为调用 API；规则和事件模型可以继续复用。

## 本地验证

不需要安装依赖，使用 Node.js 内置测试工具即可：

```bash
node --check ai-monopoly-web/src/rules.js
node --check ai-monopoly-web/src/game-logic.js
node --check ai-monopoly-web/src/events.js
node --check ai-monopoly-web/src/storage.js
node --check ai-monopoly-web/app.js
node --test ai-monopoly-web/tests/*.test.js
```

## 使用建议

1. 第一次课先新增班级和小组。
2. 每次课堂经营回合选择当前小组，再点击策略或问答奖励。
3. 期末前导出数据备份。
4. 期末答辩时打开“期末卡牌”和“期末评分”两个页签使用。

## 数据保存说明

数据默认保存在当前浏览器的 localStorage 中。优点是不用服务器、不用登录、打开即用；缺点是换电脑、换浏览器、清理浏览器数据后不会自动同步。

课堂正式使用时，建议每次课后点击“导出数据”保存 JSON 备份。

## 更稳的数据方案

当前版本适合单机课堂试运行。若要长期使用，推荐升级为以下任一方案：

1. 本地文件方案：使用浏览器文件系统 API，把数据保存到教师指定的 JSON 文件。优点是仍然不需要服务器；缺点是浏览器兼容性和授权流程略复杂。
2. 轻量后端方案：用 Node.js / SQLite 保存班级、小组、记录和评分。优点是稳定、可多设备访问；缺点是需要启动本地服务。
3. 在线表格方案：把数据同步到飞书多维表格、腾讯文档或 Google Sheets。优点是老师容易管理和分享；缺点是需要平台授权。
4. 云端数据库方案：使用 Supabase / Firebase / Vercel KV。优点是适合长期产品化；缺点是需要账号、网络和权限配置。

如果只是本学期课堂使用，建议先采用“localStorage + 每次课后导出 JSON”。如果要多个老师、多台电脑共同使用，建议做“轻量后端 + SQLite”。

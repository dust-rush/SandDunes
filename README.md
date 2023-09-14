<h1 align='center'>🏜 SandDunes</h1>
<p align='center'>SandDunes is a database based on columns and tables created to be <b><i>simple</i></b> but useful and efficient in testing, development and production environments.</p>

<h3>[⚡] — Features</h3>
<p>It is a local database with its own files, the intention is to be simple, to be easily maintained and have simplicity in maintenance as the library has options to indent data files to improve readability. Speaking a little more about the files, two extensions are used being: <strong>".dune"</strong> and <strong>".dust"</strong>.</p>

<blockquote>".dune": contains data models;</blockquote>
<blockquote>".dust": truly contains data of tables (encryption options are being considered);</blockquote>

<p>In general, your learning curve will be very low, as your goal is to be simple and friendly to new developers both as users or contributors. </p>

<h3>[⚡] — Quick Start</h3>

```js
/* services/database.js */

const SandDunes = require('dunes')
const database = new SandDunes.default()

database.init().then(() => {
    database.create('User', {
        name: 'John Doe'
    }) // > { _ref: ColumnReferenceUUID, fields: { _ref: ColumnReferenceUUID, name: 'John Doe' } }
})
```

<hr />

<h4>[🔺] — You can contribute to the growth of this library, just pay attention to the commit patterns that will be configured soon. Okay?</h4>
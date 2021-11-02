import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';

[
    {
        name: 'learn-react',
        upvotes: 0,
        comments: [],
    }, {
        name: 'learn-node',
        upvotes: 0,
        comments: [],
    }, {
        name: 'my-thoughts-on-resumes',
        upvotes: 0,
        comments: [],
    },
]

const app = express();

app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());

const withDB = async (operations, res) => {
    try {
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true });
        const db = client.db('my-blog');
    
        await operations(db);
    
        client.close();
    } catch (error) {
        res.status(500).json({ message: 'Error connecting to db', error });
    }
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }

app.get('/api/articles/:id', async (req, res) => {
    withDB(async (db) => {
        const articleId = req.params.id;

        const articleInfo = await db.collection('articles').findOne({ id: parseInt(articleId) })
        res.status(200).json(articleInfo);
    }, res);
})


app.get('/api/articlescontent/', async (req, res) => {
    withDB(async (db) => {

        // const article_content = await db.collection('article_content').find();
        // res.status(200).json(article_content);
        const articleInfo = await db.collection('article_content').find().toArray();
        res.status(200).json(articleInfo);
    }, res);
    // res.status(200).json({status : 'got it'});
})

app.get('/api/articlecontent/:id', async (req, res) => {
    withDB(async (db) => {
        const articleId = parseInt(req.params.id);

        const articleContent = await db.collection('article_content').findOne({ id: articleId })
        res.status(200).json(articleContent);
    }, res);
})

app.post('/api/articles/:id/upvote', async (req, res) => {
    withDB(async (db) => {
        const articleId = parseInt(req.params.id);
    
        const articleInfo = await db.collection('articles').findOne({ id: articleId });
        await db.collection('articles').updateOne({ id: articleId }, {
            '$set': {
                upvotes: articleInfo.upvotes + 1,
            },
        });
        const updatedArticleInfo = await db.collection('articles').findOne({ id: articleId });
    
        res.status(200).json(updatedArticleInfo);
    }, res);
});

app.post('/api/articles/:id/add-comment', (req, res) => {
    const { username, text } = req.body;
    const articleId = parseInt(req.params.id);

    withDB(async (db) => {
        const articleInfo = await db.collection('articles').findOne({ id: articleId });
        await db.collection('articles').updateOne({ id: articleId }, {
            '$set': {
                comments: articleInfo.comments.concat({ username, text }),
            },
        });
        const updatedArticleInfo = await db.collection('articles').findOne({ id: articleId });

        res.status(200).json(updatedArticleInfo);
    }, res);
});

app.post('/api/articles/add-post', (req, res) => {
    const { title, text } = req.body;
    const id = getRandomInt(10000);

    withDB(async (db) => {
        await db.collection('article_content').insert({ id: id, name: 'testuser', title : title, content : text });
        await db.collection('articles').insert({ id: id,  upvotes : 0, comments : [] });
        const updatedArticleContents = await db.collection('article_content').find().toArray();

        res.status(200).json(updatedArticleContents);
    }, res);
});

app.post('/api/articles/:id/update-post', (req, res) => {
    const {username, text } = req.body;
    const articleId = parseInt(req.params.id);

    withDB(async (db) => {
        await db.collection('article_content').updateOne({ id: articleId }, {
            '$set': {
                content: text,
            },
        });
        const updatedArticleContents = await db.collection('article_content').find().toArray();

        res.status(200).json(updatedArticleContents);
    }, res);
});

app.get('/api/articles/delete-post/:id', (req, res) => {
    const postId = parseInt(req.params.id);
    withDB(async (db) => {
        await db.collection('article_content').deleteOne({ id: postId});
        await db.collection('articles').deleteOne({ id: postId});
        const updatedArticleContents = await db.collection('article_content').find().toArray();

        res.status(200).json(updatedArticleContents);
    }, res);
});


app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
});

app.listen(8000, () => console.log('Listening on port 8000'));
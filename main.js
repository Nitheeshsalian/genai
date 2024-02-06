import { MongoClient } from "mongodb";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: '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' });

const client = new MongoClient("mongodb+srv://admin:admin@cluster0.ls5ezu2.mongodb.net/");
const hf_token = process.env.HF_ACCESS_TOKEN;

const embeddingUrl =
  "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2";

async function main() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged deployment. You successfully connected to your MongoDB Atlas cluster."
    );
    // await generateEmbeddings("Pinged deployment. You successfully connected to your MongoDB Atlas cluster");
    // await saveEmbeddings();
    await queryEmbeddings("CUSTADV called client to confirm if she is aware of her delivery");
  } finally {
    console.log("Closing connection.");
    await client.close();
  }
}

// After a successful connection, comment out to execute generateEmbeddings function
main().catch(console.dir);

// GENERATE EMBEDDINGS
async function generateEmbeddings(text) {
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  })
  const [{ embedding }] = embeddingResponse.data

  console.log('embedding', embedding)

  return embedding
}

// SAVE PLOT EMBEDDINGS to 50 MOVIES
async function saveEmbeddings() {
  try {
    await client.connect();

    const db = client.db("genai");
    const collection = db.collection("auditlogs");

    const docs = await collection
      .find({ additional_details: { $exists: true } })
      .limit(100)
      .toArray();

    for (let doc of docs) {
      let text = '';
      if (doc.additional_details.Notes) {
        text = doc.additional_details.Notes;
      } else if (doc.additional_details.ExceptionType) {
        text = doc.additional_details.ExceptionType
      }
      doc.notes_embedding = await generateEmbeddings(text);
      await collection.replaceOne({ _id: doc._id }, doc);
      console.log(`Updated ${doc._id}`);
    }
  } finally {
    console.log("Closing connection.");
    await client.close();
  }
}

async function queryEmbeddings(query) {
  try {
    await client.connect();

    const db = client.db("genai");
    const collection = db.collection("auditlogs");

    const vectorizedQuery = await generateEmbeddings(query);

    const results = await collection
      .aggregate([
        {
          $vectorSearch: {
            index: "vector_index",
            queryVector: vectorizedQuery,
            path: "notes_embedding",
            limit: 4,
            numCandidates: 100,
          },
        },
        {
          $project: {
            _id: 0,
            user: 1,
            template_id: 1,
            audit_category: 1,
            additional_details: 1,
          },
        },
      ])
      .toArray();


    console.log("results " + JSON.stringify(results));
  } finally {
    console.log("Closing connection.");
    await client.close();
  }
}



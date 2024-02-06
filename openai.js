import OpenAI from "openai";

const openai = new OpenAI({apiKey: 'sk-A2ZTWuBbUwfTQpqdJJeiT3B1bkFJuJX5UFbzAa2Z78xiWvb'});

async function main() {
  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: "what is height of mount everest ?" }],
    model: "gpt-3.5-turbo-1106",
  });

  console.log(completion.choices[0]);
}

main();
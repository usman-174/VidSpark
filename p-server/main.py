from fastapi import FastAPI, Request
from pydantic import BaseModel
from llama_cpp import Llama
from fastapi.middleware.cors import CORSMiddleware

# Load model once at startup
llm = Llama(model_path="qwen.gguf", n_ctx=2048, n_threads=4)

app = FastAPI()

# CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or set to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Prompt(BaseModel):
    prompt: str

@app.post("/generate")
async def generate_text(prompt: Prompt):
    output = llm(prompt.prompt, max_tokens=306)
    return {"response": output["choices"][0]["text"]}

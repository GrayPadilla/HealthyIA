from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

API_URL = "YOUR_HF_TOKEN_HERE"
HEADERS = {"Authorization": "YOUR_HF_TOKEN_HERE"}

@app.route("/chat", methods=["POST"])
def chat():
    user_message = request.json.get("message", "")
    response = requests.post(API_URL, headers=HEADERS, json={"inputs": user_message})
    data = response.json()

    # Si Hugging Face devuelve texto
    if isinstance(data, list) and "generated_text" in data[0]:
        reply = data[0]["generated_text"]
    elif "generated_text" in data:
        reply = data["generated_text"]
    else:
        reply = "No pude obtener una respuesta en este momento 🤖"

    return jsonify({"reply": reply})

if __name__ == "__main__":
    app.run(port=5000)

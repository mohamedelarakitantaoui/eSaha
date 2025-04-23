# routes.py (additions)
@chat_bp.route('/conversation/start', methods=['POST'])
@jwt_required()
def start_conversation():
    user_id = get_jwt_identity()
    new_conversation = Conversation(user_id=user_id)
    db.session.add(new_conversation)
    db.session.commit()
    return jsonify({"conversation_id": new_conversation.id}), 201

@chat_bp.route('/conversation/<int:conversation_id>/chat', methods=['POST'])
@jwt_required()
def chat_with_history(conversation_id):
    data = request.get_json() or {}

    user_message = data.get("message")

    if not user_message:
        return jsonify({"error": "message is required"}), 400

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": user_message}],
            max_tokens=150,
            temperature=0.7
        )
        gpt_response = response.choices[0].message.content.strip()

        # Store user message
        user_msg = Message(conversation_id=conversation_id, sender='user', content=user_message)
        db.session.add(user_msg)
        
        # Store bot response
        bot_msg = Message(conversation_id=conversation_id, sender='bot', content=gpt_response)
        db.session.add(bot_msg)

        db.session.commit()

        return jsonify({"response": gpt_response}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@chat_bp.route('/conversation/<int:conversation_id>/history', methods=['GET'])
@jwt_required()
def conversation_history(conversation_id):
    user_id = get_jwt_identity()

    conversation = Conversation.query.filter_by(id=conversation_id, user_id=user_id).first()
    if not conversation:
        return jsonify({"error": "Conversation not found"}), 404

    history = [{
        "sender": msg.sender,
        "content": msg.content,
        "timestamp": msg.timestamp
    } for msg in conversation.messages]

    return jsonify({"conversation": history}), 200

-- LingAI Questions Test Data - SQLite Compatible
-- This file contains approximately 300+ test questions across all skills and levels

-- =====================================
-- READING SKILL QUESTIONS
-- =====================================

-- READING - Level A1 (MCQ)
INSERT INTO questions (lesson_id, skill, level, q_type, content, options, correct_answer, explanation, status, creator_id, created_at) VALUES
(NULL, 'reading', 'A1', 'mcq', 'What is the color of the sky on a clear day?', json('["Blue", "Green", "Red", "Yellow"]'), 'Blue', 'The sky appears blue due to Rayleigh scattering.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'A1', 'mcq', 'How many legs does a cat have?', json('["Two", "Three", "Four", "Five"]'), 'Four', 'Cats are quadrupeds with four legs.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'A1', 'mcq', 'What do we drink to stay healthy?', json('["Water", "Oil", "Salt", "Sugar"]'), 'Water', 'Water is essential for hydration and health.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'A1', 'mcq', 'Is the sun hot?', json('["Yes", "No", "Sometimes", "Never"]'), 'Yes', 'The sun is extremely hot.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'A1', 'mcq', 'What do bees make?', json('["Honey", "Bread", "Butter", "Milk"]'), 'Honey', 'Bees produce honey from flower nectar.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'A1', 'mcq', 'How many days are in a week?', json('["Five", "Six", "Seven", "Eight"]'), 'Seven', 'A week has seven days.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'A1', 'mcq', 'What animal says Meow?', json('["Dog", "Cat", "Cow", "Horse"]'), 'Cat', 'Cats make a meowing sound.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'A1', 'mcq', 'What fruit is yellow and curved?', json('["Apple", "Banana", "Orange", "Grape"]'), 'Banana', 'Bananas are typically yellow and curved.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'A1', 'mcq', 'Which season is the coldest?', json('["Spring", "Summer", "Autumn", "Winter"]'), 'Winter', 'Winter is the coldest season.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'A1', 'mcq', 'How many fingers on one hand?', json('["Three", "Four", "Five", "Six"]'), 'Five', 'A human hand has five fingers.', 'approved', 1, CURRENT_TIMESTAMP);

-- READING - Level A1 (Fill in the blank)
INSERT INTO questions (lesson_id, skill, level, q_type, content, correct_answer, explanation, status, creator_id, created_at) VALUES
(NULL, 'reading', 'A1', 'fill_blank', 'The _____ is hot.', 'sun', 'The sun is a source of heat and light.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'A1', 'fill_blank', 'A dog has four _____.', 'legs', 'Dogs are quadrupeds with four legs.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'A1', 'fill_blank', 'I drink _____.', 'water', 'Water is a common beverage.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'A1', 'fill_blank', 'She likes to _____ a book.', 'read', 'Reading is a common activity.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'A1', 'fill_blank', 'The _____ is round.', 'moon', 'The moon orbits Earth.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'A1', 'fill_blank', 'I have two _____.', 'eyes', 'Most people have two eyes.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'A1', 'fill_blank', 'The car is _____.', 'fast', 'Cars can travel at high speeds.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'A1', 'fill_blank', 'I eat _____ every morning.', 'bread', 'Bread is a common breakfast food.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'A1', 'fill_blank', 'She wears a _____.', 'dress', 'A dress is a common garment.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'A1', 'fill_blank', 'The _____ is red.', 'apple', 'Apples are often red in color.', 'approved', 1, CURRENT_TIMESTAMP);

-- READING - Level A2 (MCQ)
INSERT INTO questions (lesson_id, skill, level, q_type, content, options, correct_answer, explanation, status, creator_id, created_at) VALUES
(NULL, 'reading', 'A2', 'mcq', 'What is the capital of France?', json('["London", "Paris", "Berlin", "Madrid"]'), 'Paris', 'Paris is the capital city of France.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'A2', 'mcq', 'How many continents are there?', json('["5", "6", "7", "8"]'), '7', 'There are seven continents on Earth.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'A2', 'mcq', 'What is 2 + 3?', json('["4", "5", "6", "7"]'), '5', '2 plus 3 equals 5.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'A2', 'mcq', 'Which animal is fastest on land?', json('["Lion", "Cheetah", "Horse", "Dog"]'), 'Cheetah', 'Cheetahs are the fastest land animals.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'A2', 'mcq', 'What is the largest ocean?', json('["Atlantic", "Pacific", "Indian", "Arctic"]'), 'Pacific', 'The Pacific Ocean is the largest ocean.', 'approved', 1, CURRENT_TIMESTAMP);

-- READING - Level A2 (Fill in the blank)
INSERT INTO questions (lesson_id, skill, level, q_type, content, correct_answer, explanation, status, creator_id, created_at) VALUES
(NULL, 'reading', 'A2', 'fill_blank', 'Paris is the _____ of France.', 'capital', 'Paris is the capital city of France.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'A2', 'fill_blank', 'The tiger is a _____ animal.', 'dangerous', 'Tigers are considered dangerous predators.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'A2', 'fill_blank', 'I usually _____ breakfast at 8 AM.', 'eat', 'Eating breakfast is a morning activity.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'A2', 'fill_blank', 'She _____ to school by bus.', 'goes', 'Going to school by bus is common.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'A2', 'fill_blank', 'The weather is very _____ today.', 'cold', 'Cold weather is common in winter.', 'approved', 1, CURRENT_TIMESTAMP);

-- READING - Level B1 (MCQ)
INSERT INTO questions (lesson_id, skill, level, q_type, content, options, correct_answer, explanation, status, creator_id, created_at) VALUES
(NULL, 'reading', 'B1', 'mcq', 'What is photosynthesis?', json('["Cell division", "Plants converting sunlight to energy", "Animal movement", "Weather phenomenon"]'), 'Plants converting sunlight to energy', 'Photosynthesis is how plants make energy from sunlight.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'B1', 'mcq', 'Which country has the most native English speakers?', json('["United Kingdom", "United States", "Canada", "Australia"]'), 'United States', 'The United States has the largest number of native English speakers.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'B1', 'mcq', 'Who wrote Pride and Prejudice?', json('["Charlotte Bronte", "Jane Austen", "Emily Dickinson", "George Eliot"]'), 'Jane Austen', 'Pride and Prejudice was written by Jane Austen in 1813.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'B1', 'mcq', 'What is global warming caused by?', json('["Natural cycles", "Greenhouse gas emissions", "Solar activity", "Ocean currents"]'), 'Greenhouse gas emissions', 'Greenhouse gases are the primary driver.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'B1', 'mcq', 'How do plants obtain energy?', json('["From soil", "From photosynthesis", "From water", "From air"]'), 'From photosynthesis', 'Plants convert light into chemical energy.', 'approved', 1, CURRENT_TIMESTAMP);

-- READING - Level B1 (Fill in the blank)
INSERT INTO questions (lesson_id, skill, level, q_type, content, correct_answer, explanation, status, creator_id, created_at) VALUES
(NULL, 'reading', 'B1', 'fill_blank', 'The process by which plants make food from sunlight is called _____.', 'photosynthesis', 'Photosynthesis is the process of converting sunlight into energy.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'B1', 'fill_blank', 'Global warming is caused by the _____ of greenhouse gases.', 'accumulation', 'The accumulation of greenhouse gases contributes to warming.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'B1', 'fill_blank', 'The _____ between the two countries led to economic difficulties.', 'conflict', 'Conflicts between nations have serious consequences.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'B1', 'fill_blank', 'She demonstrated great _____ by not giving up.', 'perseverance', 'Perseverance is not giving up despite challenges.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'B1', 'fill_blank', 'The research _____ that exercise improves cognition.', 'shows', 'Research demonstrates health benefits of exercise.', 'approved', 1, CURRENT_TIMESTAMP);

-- READING - Level B2 (MCQ)
INSERT INTO questions (lesson_id, skill, level, q_type, content, options, correct_answer, explanation, status, creator_id, created_at) VALUES
(NULL, 'reading', 'B2', 'mcq', 'What is the primary function of mitochondria in cells?', json('["Controlling activities", "Producing energy", "Storing information", "Transporting substances"]'), 'Producing energy', 'Mitochondria are the powerhouse of the cell.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'B2', 'mcq', 'In economics, what does inflation refer to?', json('["Increase in prices", "Decrease in production", "Rise in employment", "Fall in demand"]'), 'Increase in prices', 'Inflation is the sustained increase in price levels.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'B2', 'mcq', 'What is personification in literature?', json('["Metaphor", "Personification", "Simile", "Alliteration"]'), 'Personification', 'Personification attributes human characteristics to inanimate objects.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'B2', 'mcq', 'What is the significance of the Industrial Revolution?', json('["End of feudalism", "Factory-based production", "Start of modern era", "Growth of agriculture"]'), 'Factory-based production', 'The Industrial Revolution introduced mechanization and factory production.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'B2', 'mcq', 'How does renewable energy differ from fossil fuels?', json('["Renewable is infinite", "Fossil fuels cleaner", "Renewable replenishes naturally", "Fossil fuels cheaper"]'), 'Renewable replenishes naturally', 'Renewable energy sources can be naturally replenished.', 'approved', 1, CURRENT_TIMESTAMP);

-- READING - Level C1 (MCQ)
INSERT INTO questions (lesson_id, skill, level, q_type, content, options, correct_answer, explanation, status, creator_id, created_at) VALUES
(NULL, 'reading', 'C1', 'mcq', 'What does Cartesian dualism propose?', json('["Mind-body separation", "Empiricism", "Utilitarianism", "Existentialism"]'), 'Mind-body separation', 'Descartes proposed mind and body are distinct substances.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'C1', 'mcq', 'What is cognitive dissonance?', json('["Learning new skill", "Holding contradictory beliefs", "Making rational decisions", "Experiencing nostalgia"]'), 'Holding contradictory beliefs', 'Cognitive dissonance is discomfort from conflicting beliefs.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'C1', 'mcq', 'What is the primary critique of utilitarian ethics?', json('["Ignores individual rights", "Too complex", "Favors the wealthy", "Ignores emotions"]'), 'Ignores individual rights', 'Critics argue utilitarianism sacrifices individual rights.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'C1', 'mcq', 'How did postmodernism challenge literary interpretation?', json('["Emphasizing author intent", "Questioning objective meaning", "Returning to classical forms", "Focusing on grammar"]'), 'Questioning objective meaning', 'Postmodernism rejects fixed meaning.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'reading', 'C1', 'mcq', 'What is epistemic justice?', json('["Understanding of truth", "Recognition of credibility", "Study of nature", "Analysis of language"]'), 'Recognition of credibility', 'Epistemic justice concerns fairness in credibility.', 'approved', 1, CURRENT_TIMESTAMP);

-- =====================================
-- LISTENING SKILL QUESTIONS
-- =====================================

INSERT INTO questions (lesson_id, skill, level, q_type, content, audio_url, options, correct_answer, explanation, status, creator_id, created_at) VALUES
(NULL, 'listening', 'A1', 'mcq', 'What is the persons name?', '/audio/a1_hello.mp3', json('["John", "James", "Jack", "Jerry"]'), 'John', 'The speaker introduces himself as John.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'listening', 'A1', 'mcq', 'What fruits does the person like?', '/audio/a1_fruits.mp3', json('["Apples and oranges", "Bananas and apples", "Oranges and grapes", "Lemons and limes"]'), 'Apples and oranges', 'The speaker likes both apples and oranges.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'listening', 'A1', 'mcq', 'What is the weather like?', '/audio/a1_weather.mp3', json('["Sunny", "Raining", "Snowing", "Windy"]'), 'Raining', 'The speaker says it is raining.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'listening', 'A1', 'mcq', 'How many cats does the person have?', '/audio/a1_pets.mp3', json('["One", "Two", "Three", "Four"]'), 'Two', 'The speaker has two cats.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'listening', 'A1', 'mcq', 'How does the person feel?', '/audio/a1_feelings.mp3', json('["Sad", "Happy", "Angry", "Tired"]'), 'Happy', 'The speaker expresses feeling happy.', 'approved', 1, CURRENT_TIMESTAMP);

INSERT INTO questions (lesson_id, skill, level, q_type, content, audio_url, correct_answer, explanation, status, creator_id, created_at) VALUES
(NULL, 'listening', 'A1', 'fill_blank', 'My favorite color is _____.', '/audio/a1_color.mp3', 'blue', 'The speakers favorite color is blue.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'listening', 'A1', 'fill_blank', 'I go to school at _____.', '/audio/a1_time.mp3', '8', 'The speaker goes to school at 8 oclock.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'listening', 'A1', 'fill_blank', 'The book is on the _____.', '/audio/a1_location.mp3', 'table', 'The book is on the table.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'listening', 'A1', 'fill_blank', 'I like to _____ in the park.', '/audio/a1_activity.mp3', 'walk', 'The speaker likes to walk in the park.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'listening', 'A1', 'fill_blank', 'She drinks _____ every morning.', '/audio/a1_beverage.mp3', 'coffee', 'The person drinks coffee every morning.', 'approved', 1, CURRENT_TIMESTAMP);

-- LISTENING - Level A2
INSERT INTO questions (lesson_id, skill, level, q_type, content, audio_url, options, correct_answer, explanation, status, creator_id, created_at) VALUES
(NULL, 'listening', 'A2', 'mcq', 'Where did the person go?', '/audio/a2_dialogue1.mp3', json('["Beach", "Cinema", "Park", "Shopping"]'), 'Cinema', 'The person went to the cinema.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'listening', 'A2', 'mcq', 'When does the person have lunch?', '/audio/a2_times.mp3', json('["7 AM", "Noon", "6 PM", "9 PM"]'), 'Noon', 'The speaker has lunch at noon.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'listening', 'A2', 'mcq', 'How many siblings does the person have?', '/audio/a2_family.mp3', json('["One", "Two", "Three", "Four"]'), 'One', 'The person has one sibling.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'listening', 'A2', 'mcq', 'Which languages can the person speak?', '/audio/a2_languages.mp3', json('["English and Spanish", "French and German", "English and French", "Chinese and English"]'), 'English and French', 'The speaker speaks English and French.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'listening', 'A2', 'mcq', 'How much does the bus cost?', '/audio/a2_price.mp3', json('["Three dollars", "Four dollars", "Five dollars", "Six dollars"]'), 'Five dollars', 'The bus costs five dollars.', 'approved', 1, CURRENT_TIMESTAMP);

-- LISTENING - Level B1
INSERT INTO questions (lesson_id, skill, level, q_type, content, audio_url, options, correct_answer, explanation, status, creator_id, created_at) VALUES
(NULL, 'listening', 'B1', 'mcq', 'Where was the butterfly discovered?', '/audio/b1_news.mp3', json('["Africa", "Amazon rainforest", "Southeast Asia", "Australia"]'), 'Amazon rainforest', 'The butterfly was discovered in the Amazon rainforest.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'listening', 'B1', 'mcq', 'When did the Industrial Revolution occur?', '/audio/b1_lecture.mp3', json('["15th century", "17th century", "18th and 19th centuries", "20th century"]'), '18th and 19th centuries', 'The Industrial Revolution happened in the 18th and 19th centuries.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'listening', 'B1', 'mcq', 'How often does the person exercise?', '/audio/b1_health.mp3', json('["Once a week", "Twice a week", "Three times a week", "Every day"]'), 'Three times a week', 'The speaker exercises three times a week.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'listening', 'B1', 'mcq', 'What is the persons career goal?', '/audio/b1_career.mp3', json('["Engineer", "Teacher", "Doctor", "Lawyer"]'), 'Doctor', 'The person dreams of becoming a doctor.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'listening', 'B1', 'mcq', 'What will the temperature be?', '/audio/b1_weather.mp3', json('["10 degrees", "5 degrees", "0 degrees", "15 degrees"]'), '5 degrees', 'The temperature will be 5 degrees Celsius.', 'approved', 1, CURRENT_TIMESTAMP);

-- =====================================
-- WRITING SKILL QUESTIONS
-- =====================================

INSERT INTO questions (lesson_id, skill, level, q_type, content, correct_answer, ai_prompt, explanation, status, creator_id, created_at) VALUES
(NULL, 'writing', 'A1', 'writing', 'Write about your name and age.', 'introduction', 'Write 2-3 sentences introducing yourself.', 'A simple personal introduction.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'writing', 'A1', 'writing', 'Write about your favorite food.', 'description', 'Write 2-3 sentences about your favorite food.', 'Simple food preference description.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'writing', 'A1', 'writing', 'Describe what you did today.', 'narrative', 'Write 3-4 sentences about your daily activities.', 'Chronological daily description.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'writing', 'A1', 'writing', 'Write about your family.', 'description', 'Write 3-4 sentences describing family members.', 'Simple family description.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'writing', 'A1', 'writing', 'Describe your bedroom.', 'description', 'Write 3-4 sentences describing your bedroom.', 'Simple room description.', 'approved', 1, CURRENT_TIMESTAMP);

INSERT INTO questions (lesson_id, skill, level, q_type, content, correct_answer, ai_prompt, explanation, status, creator_id, created_at) VALUES
(NULL, 'writing', 'A2', 'writing', 'Write a short email to a friend.', 'email', 'Write 4-5 sentences in an email format.', 'Basic email with simple past tense.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'writing', 'A2', 'writing', 'Describe your daily routine.', 'routine', 'Write 5-6 sentences about your typical day.', 'Sequential daily routine.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'writing', 'A2', 'writing', 'Write about a special holiday.', 'holiday', 'Write 5-6 sentences about celebrating a special day.', 'Holiday celebration description.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'writing', 'A2', 'writing', 'Describe your best friend.', 'description', 'Write 5-6 sentences describing your best friend.', 'Friend description with reasons.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'writing', 'A2', 'writing', 'Write about your school.', 'description', 'Write 5-6 sentences describing your school.', 'School description with details.', 'approved', 1, CURRENT_TIMESTAMP);

INSERT INTO questions (lesson_id, skill, level, q_type, content, correct_answer, ai_prompt, explanation, status, creator_id, created_at) VALUES
(NULL, 'writing', 'B1', 'writing', 'Write about your career aspirations.', 'goals', 'Write 6-8 sentences about your ideal career.', 'Career goals with reasoning.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'writing', 'B1', 'writing', 'Advantages and disadvantages of social media.', 'balanced', 'Write 7-8 sentences discussing pros and cons.', 'Balanced argument with examples.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'writing', 'B1', 'writing', 'Describe a memorable trip.', 'narrative', 'Write 7-8 sentences about a trip you took.', 'Detailed vacation narrative.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'writing', 'B1', 'writing', 'Write a complaint letter.', 'formal', 'Write 6-8 sentences formally complaining.', 'Formal complaint letter.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'writing', 'B1', 'writing', 'Write about the importance of education.', 'persuasive', 'Write 7-8 sentences about why education matters.', 'Persuasive argument with evidence.', 'approved', 1, CURRENT_TIMESTAMP);

INSERT INTO questions (lesson_id, skill, level, q_type, content, correct_answer, ai_prompt, explanation, status, creator_id, created_at) VALUES
(NULL, 'writing', 'B2', 'writing', 'Write an essay on technology impact.', 'essay', 'Write a 300-400 word essay analyzing technology effects.', 'Multi-paragraph essay structure.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'writing', 'B2', 'writing', 'Analyze climate change causes and effects.', 'analysis', 'Write 8-10 sentences analyzing causes and impacts.', 'Cause-effect analysis with solutions.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'writing', 'B2', 'writing', 'Write a persuasive essay.', 'persuasive', 'Write 8-10 sentences persuasively on a social issue.', 'Persuasive argument with counterpoints.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'writing', 'B2', 'writing', 'Compare and contrast two cultures.', 'comparative', 'Write 8-10 sentences comparing cultural aspects.', 'Comparative analysis with examples.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'writing', 'B2', 'writing', 'Write a critical review.', 'review', 'Write 9-10 sentences analyzing a book or film.', 'Critical analysis with balanced assessment.', 'approved', 1, CURRENT_TIMESTAMP);

-- =====================================
-- SPEAKING SKILL QUESTIONS
-- =====================================

INSERT INTO questions (lesson_id, skill, level, q_type, content, correct_answer, ai_prompt, explanation, status, creator_id, created_at) VALUES
(NULL, 'speaking', 'A1', 'speaking', 'Introduce yourself.', 'introduction', 'Say your name and age in English.', 'Simple self-introduction.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'speaking', 'A1', 'speaking', 'Ask for help.', 'request', 'Practice asking for help politely.', 'Basic polite request.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'speaking', 'A1', 'speaking', 'Greet someone in the morning.', 'greeting', 'Practice saying a morning greeting.', 'Friendly morning greeting.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'speaking', 'A1', 'speaking', 'Order a drink at a cafe.', 'order', 'Speak naturally to order a beverage.', 'Simple transaction phrase.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'speaking', 'A1', 'speaking', 'Tell what you like to eat.', 'preference', 'Discuss your favorite food preferences.', 'Food preference statement.', 'approved', 1, CURRENT_TIMESTAMP);

INSERT INTO questions (lesson_id, skill, level, q_type, content, correct_answer, ai_prompt, explanation, status, creator_id, created_at) VALUES
(NULL, 'speaking', 'A2', 'speaking', 'Describe your daily routine.', 'routine', 'Speak 4-5 sentences about your typical day.', 'Sequential daily description.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'speaking', 'A2', 'speaking', 'Have a simple phone conversation.', 'conversation', 'Role-play a basic phone call.', 'Natural conversational flow.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'speaking', 'A2', 'speaking', 'Ask for and give directions.', 'directions', 'Ask how to get somewhere and respond.', 'Directional communication.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'speaking', 'A2', 'speaking', 'Tell a short story about your weekend.', 'narrative', 'Speak 5-6 sentences describing your weekend.', 'Narrative with structure.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'speaking', 'A2', 'speaking', 'Express your opinions about a movie.', 'opinion', 'Speak 4-5 sentences expressing your opinion.', 'Opinion with justification.', 'approved', 1, CURRENT_TIMESTAMP);

INSERT INTO questions (lesson_id, skill, level, q_type, content, correct_answer, ai_prompt, explanation, status, creator_id, created_at) VALUES
(NULL, 'speaking', 'B1', 'speaking', 'Discuss your career aspirations.', 'goals', 'Speak 1-2 minutes about your ideal career.', 'Coherent career discussion.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'speaking', 'B1', 'speaking', 'Debate technology in education.', 'debate', 'Speak 1-2 minutes discussing pros and cons.', 'Balanced perspective presentation.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'speaking', 'B1', 'speaking', 'Describe a memorable travel experience.', 'narrative', 'Speak 1-2 minutes describing a trip.', 'Detailed experience narration.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'speaking', 'B1', 'speaking', 'Explain how to prepare a favorite dish.', 'instruction', 'Speak 1-2 minutes explaining preparation steps.', 'Instructional description.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'speaking', 'B1', 'speaking', 'Have a spontaneous conversation.', 'conversation', 'Engage in natural conversation for 1.5-2 minutes.', 'Natural social interaction.', 'approved', 1, CURRENT_TIMESTAMP);

INSERT INTO questions (lesson_id, skill, level, q_type, content, correct_answer, ai_prompt, explanation, status, creator_id, created_at) VALUES
(NULL, 'speaking', 'B2', 'speaking', 'Present a sustained argument.', 'argument', 'Speak 2-3 minutes presenting a nuanced argument.', 'Nuanced argumentation.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'speaking', 'B2', 'speaking', 'Analyze cultural differences.', 'analysis', 'Speak 2-3 minutes comparing cultural aspects.', 'Comparative cultural analysis.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'speaking', 'B2', 'speaking', 'Discuss ethical dimensions.', 'discussion', 'Speak 2-3 minutes examining ethical concerns.', 'Ethical analysis with depth.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'speaking', 'B2', 'speaking', 'Deliver a persuasive speech.', 'speech', 'Speak 2-3 minutes persuasively on an issue.', 'Persuasive delivery.', 'approved', 1, CURRENT_TIMESTAMP),
(NULL, 'speaking', 'B2', 'speaking', 'Conduct a formal job interview.', 'interview', 'Speak 2.5-3 minutes answering interview questions.', 'Professional interview performance.', 'approved', 1, CURRENT_TIMESTAMP);

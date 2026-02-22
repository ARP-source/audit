CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE research_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  summary JSONB NOT NULL
);

CREATE TABLE citations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  claim_text TEXT NOT NULL,
  source_url TEXT NOT NULL
);

CREATE TABLE simulations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  inputs JSONB NOT NULL,
  predictions JSONB NOT NULL
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated insert projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow authenticated select projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow authenticated update projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow authenticated delete projects" ON projects FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Allow anon select research_data" ON research_data FOR SELECT USING (true);
CREATE POLICY "Allow anon insert research_data" ON research_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update research_data" ON research_data FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete research_data" ON research_data FOR DELETE USING (true);

CREATE POLICY "Allow anon select citations" ON citations FOR SELECT USING (true);
CREATE POLICY "Allow anon insert citations" ON citations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update citations" ON citations FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete citations" ON citations FOR DELETE USING (true);

CREATE POLICY "Allow anon select simulations" ON simulations FOR SELECT USING (true);
CREATE POLICY "Allow anon insert simulations" ON simulations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update simulations" ON simulations FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete simulations" ON simulations FOR DELETE USING (true);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select chat_messages" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Allow anon insert chat_messages" ON chat_messages FOR INSERT WITH CHECK (true);

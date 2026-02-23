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
  summary JSONB NOT NULL,
  documents_text TEXT
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

CREATE POLICY "Allow authenticated select research_data" ON research_data FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "Allow authenticated insert research_data" ON research_data FOR INSERT WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "Allow authenticated update research_data" ON research_data FOR UPDATE USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "Allow authenticated delete research_data" ON research_data FOR DELETE USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Allow authenticated select citations" ON citations FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "Allow authenticated insert citations" ON citations FOR INSERT WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "Allow authenticated update citations" ON citations FOR UPDATE USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "Allow authenticated delete citations" ON citations FOR DELETE USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Allow authenticated select simulations" ON simulations FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "Allow authenticated insert simulations" ON simulations FOR INSERT WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "Allow authenticated update simulations" ON simulations FOR UPDATE USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "Allow authenticated delete simulations" ON simulations FOR DELETE USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated select chat_messages" ON chat_messages FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "Allow authenticated insert chat_messages" ON chat_messages FOR INSERT WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

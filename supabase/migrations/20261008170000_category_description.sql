ALTER TABLE public.categories
ADD COLUMN description text,
ADD CONSTRAINT categories_description_length CHECK (char_length(description) <= 200);

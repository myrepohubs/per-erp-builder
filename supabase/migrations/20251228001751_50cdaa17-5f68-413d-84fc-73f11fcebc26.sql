-- Add unique constraint on RUC per user (each user can only have one client with the same RUC)
CREATE UNIQUE INDEX unique_ruc_per_user ON public.clientes (user_id, ruc);
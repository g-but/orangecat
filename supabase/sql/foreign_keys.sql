-- Conditional foreign keys for relational integrity (idempotent via DO blocks)

-- conversation_participants → conversations(id), profiles(id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public' AND constraint_name='fk_conv_part_conversation'
  ) THEN
    ALTER TABLE public.conversation_participants
    ADD CONSTRAINT fk_conv_part_conversation FOREIGN KEY (conversation_id)
    REFERENCES public.conversations(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public' AND constraint_name='fk_conv_part_user'
  ) THEN
    ALTER TABLE public.conversation_participants
    ADD CONSTRAINT fk_conv_part_user FOREIGN KEY (user_id)
    REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- messages → conversations(id), profiles(id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public' AND constraint_name='fk_messages_conversation'
  ) THEN
    ALTER TABLE public.messages
    ADD CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id)
    REFERENCES public.conversations(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public' AND constraint_name='fk_messages_sender'
  ) THEN
    ALTER TABLE public.messages
    ADD CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id)
    REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- project_media → projects(id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public' AND constraint_name='fk_project_media_project'
  ) THEN
    ALTER TABLE public.project_media
    ADD CONSTRAINT fk_project_media_project FOREIGN KEY (project_id)
    REFERENCES public.projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- organization_members → organizations(id), profiles(id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public' AND constraint_name='fk_org_members_org'
  ) THEN
    ALTER TABLE public.organization_members
    ADD CONSTRAINT fk_org_members_org FOREIGN KEY (organization_id)
    REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public' AND constraint_name='fk_org_members_user'
  ) THEN
    ALTER TABLE public.organization_members
    ADD CONSTRAINT fk_org_members_user FOREIGN KEY (user_id)
    REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- loan_offers → loans(id), profiles(id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public' AND constraint_name='fk_loan_offers_loan'
  ) THEN
    ALTER TABLE public.loan_offers
    ADD CONSTRAINT fk_loan_offers_loan FOREIGN KEY (loan_id)
    REFERENCES public.loans(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public' AND constraint_name='fk_loan_offers_offerer'
  ) THEN
    ALTER TABLE public.loan_offers
    ADD CONSTRAINT fk_loan_offers_offerer FOREIGN KEY (offerer_id)
    REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- loan_payments → loans(id), profiles(id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public' AND constraint_name='fk_loan_payments_loan'
  ) THEN
    ALTER TABLE public.loan_payments
    ADD CONSTRAINT fk_loan_payments_loan FOREIGN KEY (loan_id)
    REFERENCES public.loans(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public' AND constraint_name='fk_loan_payments_payer'
  ) THEN
    ALTER TABLE public.loan_payments
    ADD CONSTRAINT fk_loan_payments_payer FOREIGN KEY (payer_id)
    REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- wallets → profiles(id), projects(id) (nullable; set null on owner delete)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public' AND constraint_name='fk_wallets_profile'
  ) THEN
    ALTER TABLE public.wallets
    ADD CONSTRAINT fk_wallets_profile FOREIGN KEY (profile_id)
    REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public' AND constraint_name='fk_wallets_project'
  ) THEN
    ALTER TABLE public.wallets
    ADD CONSTRAINT fk_wallets_project FOREIGN KEY (project_id)
    REFERENCES public.projects(id) ON DELETE SET NULL;
  END IF;
END $$;


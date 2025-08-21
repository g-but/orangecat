-- Remove payment method requirement constraint to make both Bitcoin and Lightning addresses optional
-- This allows users to save drafts without payment methods and add them later

-- Drop the payment method requirement constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'funding_pages_payment_method_required'
        AND table_name = 'funding_pages'
    ) THEN
        ALTER TABLE public.funding_pages 
        DROP CONSTRAINT funding_pages_payment_method_required;
        
        -- Log the change
        RAISE NOTICE 'Removed payment method requirement constraint - both Bitcoin and Lightning addresses are now optional';
    ELSE
        RAISE NOTICE 'Payment method requirement constraint does not exist - no action needed';
    END IF;
END $$;

-- Add comment to document the change
COMMENT ON COLUMN public.funding_pages.bitcoin_address IS 'Optional Bitcoin address for receiving donations';
COMMENT ON COLUMN public.funding_pages.lightning_address IS 'Optional Lightning Network address for instant payments';

-- Update table comment to reflect the change
COMMENT ON TABLE public.funding_pages IS 'Fundraising pages created by users to accept Bitcoin donations. Payment methods are optional and can be added later.'; 
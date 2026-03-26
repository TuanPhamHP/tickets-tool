ALTER TABLE `tickets` MODIFY COLUMN `status` enum('draft','pending_review','in_review','pending_approval','approved','rejected','in_progress','completed','accepted','cancelled') NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `tickets` ADD `received_at` timestamp;--> statement-breakpoint
ALTER TABLE `tickets` ADD `estimate_start_date` timestamp;
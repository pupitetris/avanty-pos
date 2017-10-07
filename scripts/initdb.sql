BEGIN TRANSACTION;

	SET CONSTRAINTS ALL DEFERRED;
    
    DELETE FROM account;
	ALTER SEQUENCE account_user_id_seq RESTART;
    INSERT INTO account VALUES (DEFAULT, 'supervisor', '$2a$08$dcVj2sdh6IU5ixUg5m5i2e', 
                                pgcrypto.crypt('S_n2Dnw?3T_SNTkx', '$2a$08$dcVj2sdh6IU5ixUg5m5i2e')), NULL, 'first');
	INSERT INTO user_supervisor VALUES (currval('account_user_id_seq'));
    
    
COMMIT TRANSACTION;
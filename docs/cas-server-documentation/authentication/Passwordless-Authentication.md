---
layout: default
title: CAS - Passwordless Authentication
category: Authentication
---
{% include variables.html %}

# Passwordless Authentication

Passwordless Authentication is a form of authentication in CAS where passwords take the 
form of tokens that expire after a configurable period of time. 
Using this strategy, users are asked for an identifier (i.e. username) which is used to locate the user record 
that contains forms of contact such as email and phone
number. Once located, the CAS-generated token is sent to the user via the configured notification 
strategies (i.e. email, sms, etc) where the user is then expected to 
provide the token back to CAS in order to proceed. 

<div class="alert alert-info"><strong>No Magic Link</strong><p>
Presently, there is no support for magic links that would remove the task of providing the token 
back to CAS allowing the user to proceed automagically.
This variant may be worked out in future releases.</p></div>

In order to successfully implement this feature, configuration needs to be in place to contact 
account stores that hold user records who qualify for passwordless authentication. 
Similarly, CAS must be configured to manage issued tokens in order to execute find, 
validate, expire or save operations in appropriate data stores.

## Passwordless Variants

Passwordless authentication can also be activated using [QR Code Authentication](QRCode-Authentication.html),
allowing end users to login by scanning a QR code using a mobile device.

Passwordless authentication can also be 
achieved via [FIDO2 WebAuthn](../mfa/FIDO2-WebAuthn-Authentication.html) which lets users 
verify their identities without passwords and login using FIDO2-enabled devices.

## Overview

Support is enabled by including the following module in the overlay:

{% include_cached casmodule.html group="org.apereo.cas" module="cas-server-support-passwordless-webflow" %}

{% include_cached casproperties.html properties="cas.authn.passwordless.core." %}

## Account Stores

User records that qualify for passwordless authentication must 
be found by CAS using one of the following strategies. All strategies may be configured
using CAS settings and are activated depending on the presence of configuration values.

| Option  | Description                                                                |
|---------|----------------------------------------------------------------------------|
| Simple  | Please [see this guide](Passwordless-Authentication-Storage-Simple.html).  |
| MongoDb | Please [see this guide](Passwordless-Authentication-Storage-MongoDb.html). |
| LDAP    | Please [see this guide](Passwordless-Authentication-Storage-LDAP.html).    |
| JSON    | Please [see this guide](Passwordless-Authentication-Storage-JSON.html).    |
| Groovy  | Please [see this guide](Passwordless-Authentication-Storage-Groovy.html).  |
| REST    | Please [see this guide](Passwordless-Authentication-Storage-Rest.html).    |
| Custom  | Please [see this guide](Passwordless-Authentication-Storage-Custom.html).  |

## Token Management

The following strategies define how issued tokens may be managed by CAS. 

{% include_cached casproperties.html properties="cas.authn.passwordless.tokens" includes=".core,.crypto" %}

### Memory

This is the default option where tokens are kept in memory using a cache 
with a configurable expiration period. Needless to say, this option 
is not appropriate in clustered CAS deployments inside there is not a way 
to synchronize and replicate tokens across CAS nodes.

### Others

| Option  | Description                                                               |
|---------|---------------------------------------------------------------------------|
| MongoDb | Please [see this guide](Passwordless-Authentication-Tokens-MongoDb.html). |
| JPA     | Please [see this guide](Passwordless-Authentication-Tokens-JPA.html).     |
| REST    | Please [see this guide](Passwordless-Authentication-Tokens-Rest.html).    |
| Custom  | Please [see this guide](Passwordless-Authentication-Tokens-Custom.html).  |

### Messaging & Notifications
                                     
{% include_cached casproperties.html properties="cas.authn.passwordless.tokens" includes=".mail,.sms" %}

Users may be notified of tokens via text messages, mail, etc.
To learn more about available options, please [see this guide](../notifications/SMS-Messaging-Configuration.html)
or [this guide](../notifications/Sending-Email-Configuration.html).

## Disabling Passwordless Authentication Flow

Passwordless authentication can be disabled conditionally on a per-user basis. If 
the passwordless account retrieved from the account store
carries a user whose `requestPassword` is set to `true`, the passwordless flow
(i.e. as described above with token generation, etc) will
be disabled and skipped in favor of the more usual CAS authentication flow, 
challenging the user for a password. Support for this behavior may depend
on each individual account store implementation.

## Multifactor Authentication Integration

Passwordless authentication can be integrated 
with [CAS multifactor authentication providers](../mfa/Configuring-Multifactor-Authentication.html). In this scenario,
once CAS configuration is enabled to support this behavior via settings 
or the located passwordless user account is considered *eligible* for multifactor authentication,
CAS will allow passwordless authentication to skip its 
own *intended normal* flow (i.e. as described above with token generation, etc) in favor of 
multifactor authentication providers that may be available and defined in CAS.

This means that if [multifactor authentication providers](../mfa/Configuring-Multifactor-Authentication.html) are 
defined and activated, and defined 
[multifactor triggers](../mfa/Configuring-Multifactor-Authentication-Triggers.html) in CAS 
signal availability and eligibility of an multifactor flow for the given passwordless user, CAS will skip 
its normal passwordless authentication flow in favor of the requested multifactor 
authentication provider and its flow. If no multifactor providers 
are available, or if no triggers require the use of multifactor authentication 
for the verified passwordless user, passwordless authentication flow will commence as usual.

## Delegated Authentication Integration

Passwordless authentication can be integrated 
with [CAS delegated authentication](../integration/Delegate-Authentication.html). In this scenario,
once CAS configuration is enabled to support this behavior via settings or 
the located passwordless user account is considered *eligible* for delegated authentication,
CAS will allow passwordless authentication to skip its own *intended normal* 
flow (i.e. as described above with token generation, etc) in favor of 
delegated authentication that may be available and defined in CAS.

This means that if [delegated authentication providers](../integration/Delegate-Authentication.html) 
are defined and activated, CAS will skip 
its normal passwordless authentication flow in favor of the requested multifactor authentication 
provider and its flow. If no delegated identity providers 
are available, passwordless authentication flow will commence as usual.

The selection of a delegated authentication identity provider for a passwordless user is handled 
using a script. The script may be defined as such:

```groovy
def run(Object[] args) {
    def passwordlessUser = args[0]
    def clients = (Set) args[1]
    def httpServletRequest = args[2]
    def logger = args[3]
    
    logger.info("Testing username $passwordlessUser")

    clients[0]
}
``` 

The parameters passed are as follows:

| Parameter            | Description                                                                 |
|----------------------|-----------------------------------------------------------------------------|
| `passwordlessUser`   | The object representing the `PasswordlessUserAccount`.                      |
| `clients`            | The object representing the collection of identity provider configurations. |
| `httpServletRequest` | The object representing the http request.                                   |
| `logger`             | The object responsible for issuing log messages such as `logger.info(...)`. |

The outcome of the script can be `null` to skip delegated authentication for 
the user, or it could a selection from the available identity providers passed into the script.

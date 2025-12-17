import pandas as pd
# Set pandas display options to show all columns
pd.set_option('display.max_columns', None)
pd.set_option('display.width', None)
pd.set_option('display.max_colwidth', None)

df = pd.read_csv('onboarding_events_v3.csv')

print("--------------------------------")
print("Funnel Analysis")
print("--------------------------------")


# 1. Total Visitors
visitors = df[df['page_url'] == '/claim-your-account']['user_id'].unique()

# 2. Users who tried to sign up (Clicked Continue at claim your account page)
intent_users = df[
    (df['page_url'] == '/claim-your-account') & 
    (df['event_name'] == 'Clicked "continue"')
]['user_id'].unique()

# 3. Users who succeeded (Validated confirmation code)
confirmed_users = df[
    (df['page_url'] == '/confirm-phone-number') & 
    (df['event_name'] == 'Validated confirmation code')
]['user_id'].unique()

print(f"Visitors: {len(visitors)}")
print(f"Clicked Continue (Willing to give number): {len(intent_users)} | Drop Off: {round(100 - (len(intent_users) / len(visitors) * 100), 2)}%")
print(f"Validated Code (Actually verified): {len(confirmed_users)} | Drop Off: {round(100 - (len(confirmed_users) / len(intent_users) * 100), 2)}%")

# Class Selected
class_selected = df[
    (df['page_url'] == '/class-selection') & 
    (df['event_name'] == 'Selected class')
]['user_id'].unique()

# Decision Point: Skip for later vs try sample (Confetti Page)
decision_point = df[df['page_url'] == '/account-claimed']['user_id'].unique()

# Users who entered the Editor (Started making an assignment)
editor_visitors = df[df['page_url'] == '/assignment-creation']['user_id'].unique()

# Assignment Created (Reached the final creation view)
assignment_created = df[df['page_url'] == '/assignment-created-view']['user_id'].unique()

# Activated (Student actually used it)
activated_users = df[
    (df['page_url'] == '/assignment-activated') & 
    (df['event_name'] == 'Assignment activated')
]['user_id'].unique()

print(f"Class Selected: {len(class_selected)} | Drop Off: {round(100 - (len(class_selected) / len(confirmed_users) * 100), 2)}%")
print(f"Decision Point: {len(decision_point)} | Drop Off: {round(100 - (len(decision_point) / len(class_selected) * 100), 2)}% (Skip for later vs try sample)")
print(f"Entered Editor: {len(editor_visitors)} | Drop Off: {round(100 - (len(editor_visitors) / len(decision_point) * 100), 2)}%")
print(f"Assignment Created: {len(assignment_created)} | Drop Off: {round(100 - (len(assignment_created) / len(editor_visitors) * 100), 2)}%")
print(f"Activated: {len(activated_users)} | Drop Off: {round(100 - (len(activated_users) / len(assignment_created) * 100), 2)}%")

# Decision Point Analysis
print("--------------------------------")
print("Decision Point Analysis")
print("--------------------------------")

# Users who clicked "Try Sample"
sample_users = set(df[
    (df['page_url'] == '/account-claimed') & 
    (df['event_name'] == "Clicked \"Try Sample Algebra 1 Problem\"")
]['user_id'].unique())

# Users who clicked "Skip for Later"
skip_users = set(df[
    (df['page_url'] == '/account-claimed') & 
    (df['event_name'] == "Clicked \"Skip for Later\"")
]['user_id'].unique())

# Users who clicked BOTH "Try Sample" and "Skip for Later"
both_sample_and_skip = sample_users & skip_users
print(f"Users who clicked 'Try Sample': {len(sample_users)}")
print(f"Users who clicked 'Skip for Later': {len(skip_users)}")
print(f"Users who clicked BOTH 'Try Sample' and 'Skip for Later': {len(both_sample_and_skip)}")

# For users who clicked "Try Sample", % who created assignment
assignment_created_set = set(assignment_created)

try_sample_and_created = sample_users & assignment_created_set
skip_for_later_and_created = skip_users & assignment_created_set

try_sample_conversion = (len(try_sample_and_created) / len(sample_users) * 100) if len(sample_users) > 0 else 0
skip_for_later_conversion = (len(skip_for_later_and_created) / len(skip_users) * 100) if len(skip_users) > 0 else 0

print(f"\nAssignment Creation Rate after clicking 'Try Sample': {len(try_sample_and_created)}/{len(sample_users)} = {try_sample_conversion:.1f}%")
print(f"Assignment Creation Rate after clicking 'Skip for Later': {len(skip_for_later_and_created)}/{len(skip_users)} = {skip_for_later_conversion:.1f}%")


# Cohort Analysis: Does final activation rate differ between user types?
print("\n------------------------------")
print("Cohort Analysis: Activation Rate by Acquisition Type")
print("------------------------------")

if 'cohort' in df.columns:
    # Group by cohort and user_id, track funnel progress for each user
    user_funnel = df.groupby(['user_id', 'cohort']).agg({
        'page_url': list,
        'event_name': list
    }).reset_index()

    def has_assignment_created(row):
        return '/assignment-created-view' in row['page_url']

    def has_activated(row):
        return ('/assignment-activated' in row['page_url']) or ('Assignment activated' in row['event_name'])

    cohort_summary = (
        user_funnel
        .groupby('cohort')
        .apply(lambda g: pd.Series({
            'Users': g['user_id'].nunique(),
            'Created Assignment': g.apply(has_assignment_created, axis=1).sum(),
            'Activated': g.apply(has_activated, axis=1).sum()
        }), include_groups=False)
        .reset_index()
    )

    cohort_summary['% Created Assignment'] = (cohort_summary['Created Assignment'] / cohort_summary['Users'] * 100).round(1)
    cohort_summary['% Activated (overall)'] = (cohort_summary['Activated'] / cohort_summary['Users'] * 100).round(1)
    cohort_summary['% Activation post-creation'] = (
        cohort_summary['Activated'] / cohort_summary['Created Assignment'] * 100
    ).round(1).replace([float('inf'), float('nan')], 0)

    print(cohort_summary[['cohort', 'Users', '% Created Assignment', '% Activated (overall)', '% Activation post-creation']].to_string(index=False))

else:
    print("No 'cohort' column present in the dataframe. Cannot perform cohort analysis.")

# assignment_activated_count = df[
#     (df['page_url'] == '/assignment-activated') |
#     (df['event_name'] == 'Assignment activated')
# ]['user_id'].nunique()

# print(f"Number of assignment-activated events: {assignment_activated_count}")

# desktop_count = df[df['device'] == 'desktop'].shape[0]
# print(f"Number of desktop occurrences: {desktop_count}")




import CircularProgress from '@material-ui/core/CircularProgress';
import React, {PureComponent, ReactNode} from 'react';
import {ensure, ensurePropString, ensureSafeInteger} from '../common/ensure';
import {Account, AccountType} from '../common/types/Account';
import {Asset, AssetSymbol} from '../common/types/Asset';
import {Balances} from '../common/types/Balances';
import {Withdrawal} from '../common/types/Withdrawal';
import {User} from '../common/types/User';
import AccountTypeBar from '../components/AccountTypeBar';
import EmptyAccount from '../components/EmptyAccount';
import WithdrawReddit from '../components/WithdrawReddit';
import WithdrawTokens from '../components/WithdrawTokens';

type PropTypes = {
  user: User;
  getAsset: (id: number) => Asset|undefined;
  getAvailableErc20Withdrawals: () => number|undefined;
  withdraw: (withdrawal: Withdrawal) => Promise<any>;
  defaultAddress: string;
  balances: Balances|undefined;
  refreshBalances: () => void;
};
type State = {
  selectedTab: AccountType;
};
class WithdrawPage extends PureComponent<PropTypes, State> {
  state = {
    selectedTab: AccountType.ETHEREUM_ADDRESS,
  };

  render() {
    return (
      <div>
        <AccountTypeBar
            value={this.state.selectedTab}
            setValue={this.setSelectedTab} />
        {this.renderWithdrawLoop(
            this.state.selectedTab == AccountType.ETHEREUM_ADDRESS
                ? this.renderWithdrawTokensForAsset
                : this.renderRedditWithdrawForAsset)}
      </div>
    );
  }

  private setSelectedTab = (selectedTab: AccountType) => {
    this.setState({selectedTab});
  };

  private renderWithdrawLoop(callback: (assetId: number) => ReactNode) {
    if (!this.props.balances) {
      return <CircularProgress />;
    }
    const r = [];
    for (const assetId of this.props.balances.getAssetIds()) {
      r.push(
        <div key={assetId}>
          {callback(assetId)}
        </div>
      );
    }
    if (r.length == 0) {
      return <EmptyAccount refreshBalances={this.props.refreshBalances} />;
    }
    return r;
  }

  private renderWithdrawTokensForAsset = (assetId: number) => {
    const asset = this.props.getAsset(assetId);
    const balance =
        ensureSafeInteger(
            ensure(this.props.balances).getPlatformValue(assetId));
    const availableErc20Withdrawals = this.props.getAvailableErc20Withdrawals();
    if (!asset || availableErc20Withdrawals == undefined) {
      return <CircularProgress />;
    }
    return (
      <WithdrawTokens
          asset={asset}
          balance={balance}
          refreshBalances={this.props.refreshBalances}
          availableErc20Withdrawals={availableErc20Withdrawals}
          withdraw={(address: string, amount: number) =>
              this.withdrawToEthereumAddress(asset, address, amount)}
          defaultAddress={this.props.defaultAddress} />
    );
  };

  private renderRedditWithdrawForAsset = (assetId: number) => {
    const asset = this.props.getAsset(assetId);
    const balance =
        ensureSafeInteger(
            ensure(this.props.balances).getPlatformValue(assetId));
    if (!asset) {
      return <CircularProgress />;
    }
    return (
      <WithdrawReddit
          asset={asset}
          balance={balance}
          refreshBalances={this.props.refreshBalances}
          user={this.props.user}
          withdraw={(amount: number) => this.withdrawToReddit(asset, amount)} />
    );
  };

  private withdrawToEthereumAddress = (
      asset: Asset,
      address: string,
      amount: number):
      Promise<Withdrawal> => {
    return this.withdrawTo(
        asset,
        new Account(
            AccountType.ETHEREUM_ADDRESS,
            address),
        amount);
  };

  private withdrawToReddit = async (
      asset: Asset,
      amount: number):
      Promise<Withdrawal> => {
    return this.withdrawTo(
        asset,
        new Account(
            AccountType.REDDIT_USER,
            this.props.user.username),
        amount);
  };

  private async withdrawTo(
      asset: Asset,
      account: Account,
      amount: number):
      Promise<Withdrawal> {
    const withdrawal = new Withdrawal(account, asset, amount);
    const response = await this.props.withdraw(withdrawal);
    if (typeof response == 'object' && response != null) {
      if (response['transaction_id']) {
        withdrawal.transactionId = ensurePropString(response, 'transaction_id');
      }
    }
    return withdrawal;
  }
}

export default WithdrawPage;

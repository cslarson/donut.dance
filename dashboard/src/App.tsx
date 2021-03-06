import {Map} from 'immutable';
import {BrowserRouter as Router, Route} from 'react-router-dom';
import CssBaseline from '@material-ui/core/CssBaseline';
import Fade from '@material-ui/core/Fade';
import {Theme, withStyles} from '@material-ui/core/styles';
import React, {Fragment, PureComponent, ReactNode} from 'react';
import Chrome from './Chrome';
import backgroundImage from './background.jpg';
import {ensure} from './common/ensure';
import {Asset, AssetName, AssetSymbol} from './common/types/Asset';
import {Balances} from './common/types/Balances';
import {History} from './common/types/History';
import {User} from './common/types/User';
import {Withdrawal} from './common/types/Withdrawal';
import BalancesPage from './pages/Balances';
import DepositPage from './pages/Deposit';
import ErrorPage from './pages/Error';
import HistoryPage from './pages/History';
import LoginPage from './pages/Login';
import MaintenancePage from './pages/Maintenance';
import SplashPage from './pages/Splash';
import TransferPage from './pages/Transfer';
import WithdrawPage from './pages/Withdraw';

const styles = {
  container: {
    position: 'absolute' as 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    background: `url(${backgroundImage}) no-repeat center center fixed`,
    backgroundSize: 'cover',
  },
};

type PropTypes = {
  classes: {
    container: string;
  };
  initialized: boolean;
  error: any;
  apiAvailable: boolean;
  csrfToken: string;
  pathname: string;
  setPathname: (pathname: string) => void;
  user: User|null;
  logout: () => void;
  getAsset: (id: number) => Asset|undefined;
  getAssetBySymbol: (symbol: AssetSymbol) => Asset|undefined;
  asyncGetAssetBySymbol: (symbol: AssetSymbol) => Promise<Asset>;
  getPlatformBalances: (userId: string) => Balances|undefined;
  refreshPlatformBalances: (userId: string) => void;
  getMetaMaskBalance: (assetId: number) => Promise<number|null>;
  histories: Map<string, History>;
  depositTokens: ((asset: Asset, amount: number) => void)|null;
  getAvailableErc20Withdrawals: () => number|undefined;
  withdraw: (withdawal: Withdrawal) => Promise<void>;
  defaultWithdrawalAddress: string;
};
type State = {};
class App extends PureComponent<PropTypes, State> {
  unlistenFromHistory: () => void = () => {};

  constructor(props: PropTypes) {
    super(props);
  }

  render() {
    const classes = this.props.classes;
    return (
      <Router ref={this.updateRouter}>
        <CssBaseline />
        <Fade in mountOnEnter appear>
          <div className={classes.container}>
            {this.renderChrome()}
          </div>
        </Fade>
      </Router>
    );
  }

  private renderChrome() {
    if (!this.props.apiAvailable) {
      return <MaintenancePage />;
    }
    if (this.props.error) {
      return <ErrorPage error={this.props.error} />;
    }
    if (!this.props.initialized) {
      return <SplashPage />;
    }
    if (!this.props.user) {
      return <LoginPage csrfToken={this.props.csrfToken} />;
    }
    return (
      <Chrome pathname={this.props.pathname}
              user={this.props.user}
              logout={this.props.logout}>
        {this.renderPage()}
      </Chrome>
    );
  }

  private renderPage() {
    return (
      <Fragment>
        <Route key="/"
              exact
              path="/"
              title="Balances"
              render={this.renderBalancesPage} />
        <Route key="/deposit"
              exact
              path="/deposit"
              title="Deposit"
              render={this.renderDepositPage} />
        <Route key="/withdraw"
              exact
              path="/withdraw"
              title="Withdraw"
              render={this.renderWithdrawPage} />
        <Route key="/transfer"
              exact
              path="/transfer"
              title="Transfer"
              component={TransferPage} />
        <Route key="/history"
              exact
              path="/history"
              title="History"
              component={HistoryPage} />
      </Fragment>
    );
  }

  private updateRouter = (ref: any) => {
    if (ref
        && ref.history
        && ref.history.listen
        && typeof ref.history.listen == 'function') {
       if (this.unlistenFromHistory) {
         this.unlistenFromHistory();
       }
       this.unlistenFromHistory = ref.history.listen((location: any) => {
         if (location && location.pathname) {
           this.props.setPathname(location.pathname);
         }
       })
    }
  }

  private renderBalancesPage = () => {
    const user = ensure(this.props.user);
    const balances = this.props.getPlatformBalances(user.id);
    return (
      <BalancesPage
          balances={balances}
          getAsset={this.props.getAsset}
          refreshBalances={this.refreshPlatformBalances} />
    );
  };

  private renderDepositPage = () => {
    const user = ensure(this.props.user);
    return (
      <DepositPage
          depositTokens={this.props.depositTokens}
          asyncGetAssetBySymbol={this.props.asyncGetAssetBySymbol}
          getMetaMaskBalance={this.props.getMetaMaskBalance} />
    );
  };

  private renderWithdrawPage = () => {
    const user = ensure(this.props.user);
    const balances = this.props.getPlatformBalances(user.id);
    return (
      <WithdrawPage
          user={user}
          getAsset={this.props.getAsset}
          getAvailableErc20Withdrawals={this.props.getAvailableErc20Withdrawals}
          withdraw={this.props.withdraw}
          defaultAddress={this.props.defaultWithdrawalAddress}
          balances={balances}
          refreshBalances={this.refreshPlatformBalances} />
    );
  };

  private refreshPlatformBalances =
      () => this.props.refreshPlatformBalances(ensure(this.props.user).id);
}

export default withStyles(styles)(App);
